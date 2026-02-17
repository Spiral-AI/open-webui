<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { i18n as i18nType } from 'i18next';

	import { settings } from '$lib/stores';
	import { chatterSchemas } from '$lib/stores/chatter';
	import { updateUserSettings } from '$lib/apis/users';
	import { getChatterSchemas, buildChatterSystemPromptAPI } from '$lib/apis/chatter';
	import { DEFAULT_CHATTER_CONFIG } from '$lib/chatter';
	import type { ChatterConfig, ChatterCharacter, SchemaInfo } from '$lib/chatter';

	import Switch from '$lib/components/common/Switch.svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext<Writable<i18nType>>('i18n');

	let config: ChatterConfig = $settings.chatter
		? JSON.parse(JSON.stringify($settings.chatter))
		: JSON.parse(JSON.stringify(DEFAULT_CHATTER_CONFIG));

	// Migrate legacy schemaVersion → schemaName
	if ('schemaVersion' in config && !('schemaName' in config)) {
		(config as any).schemaName = `geppetto2-${(config as any).schemaVersion ?? 'v3'}`;
		delete (config as any).schemaVersion;
	}

	let showPreview = false;
	let saving = false;
	let systemPromptPreview = '';

	// Fetch schemas on mount if not already loaded
	onMount(async () => {
		if ($chatterSchemas.length === 0) {
			try {
				const schemas = await getChatterSchemas(localStorage.token);
				if (schemas) {
					chatterSchemas.set(schemas);
				}
			} catch (err) {
				console.error('Failed to fetch chatter schemas:', err);
			}
		}
	});

	$: schemaNames = $chatterSchemas.map((s: SchemaInfo) => s.name);

	// Derive active schema and available chara IDs from schema
	$: activeSchema = $chatterSchemas.find((s: SchemaInfo) => s.name === config.schemaName);
	$: charaTag = activeSchema?.tags.find((t) => t.name === 'chara');
	$: schemaCharaIds = charaTag?.values ?? [];

	// Update system prompt preview when config changes
	async function updatePreview() {
		if (config.characters.length > 0) {
			try {
				systemPromptPreview = await buildChatterSystemPromptAPI(localStorage.token, {
					schema_name: config.schemaName,
					characters: config.characters.map((c) => ({
						id: c.id,
						description: c.description
					})),
					scenario: config.scenario,
					domain: config.domain.id
				});
			} catch {
				systemPromptPreview = '(Failed to generate preview)';
			}
		} else {
			systemPromptPreview = '';
		}
	}

	$: if (showPreview && config.characters.length > 0) {
		updatePreview();
	}

	const CHARA_ACCENT_COLORS = [
		'border-l-blue-400',
		'border-l-purple-400',
		'border-l-emerald-400',
		'border-l-orange-400',
		'border-l-pink-400',
		'border-l-cyan-400'
	];

	const CHARA_BG_COLORS = [
		'bg-blue-500',
		'bg-purple-500',
		'bg-emerald-500',
		'bg-orange-500',
		'bg-pink-500',
		'bg-cyan-500'
	];

	function getCharAccent(idx: number): string {
		return CHARA_ACCENT_COLORS[idx % CHARA_ACCENT_COLORS.length];
	}

	function getCharBg(idx: number): string {
		return CHARA_BG_COLORS[idx % CHARA_BG_COLORS.length];
	}

	function getInitial(char: ChatterCharacter): string {
		return (char.name || char.id || '?')[0].toUpperCase();
	}

	// Keep activeUserCharaId in sync with user characters
	$: {
		const userChars = config.characters.filter((c) => c.role === 'user');
		if (userChars.length > 0) {
			// If current activeUserCharaId doesn't match any user character, pick the first
			if (!userChars.some((c) => c.id === config.activeUserCharaId)) {
				config.activeUserCharaId = userChars[0].id;
			}
		} else {
			config.activeUserCharaId = '';
		}
	}

	function addCharacter() {
		config.characters = [
			...config.characters,
			{
				id: '',
				name: '',
				description: '',
				role: 'assistant',
				avatarColor: ''
			}
		];
	}

	function removeCharacter(idx: number) {
		config.characters = config.characters.filter((_, i) => i !== idx);
	}

	async function save() {
		saving = true;
		$settings = { ...$settings, chatter: JSON.parse(JSON.stringify(config)) };
		await updateUserSettings(localStorage.token, { ui: $settings });
		setTimeout(() => (saving = false), 600);
	}
</script>

<div class="chatter-config-panel">
	<Collapsible title={$i18n.t('Chatter Mode')} open={config.enabled} buttonClassName="w-full">
		<div slot="content" class="flex flex-col gap-4 mt-3">
			<!-- Enable toggle -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="size-6 rounded-md bg-violet-500/15 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3.5 text-violet-500">
							<path fill-rule="evenodd" d="M10 3c-4.31 0-8 3.033-8 7 0 2.024.978 3.825 2.499 5.085a3.478 3.478 0 01-.522 1.756.75.75 0 00.584 1.143 5.976 5.976 0 003.936-1.108c.487.082.99.124 1.503.124 4.31 0 8-3.033 8-7s-3.69-7-8-7z" clip-rule="evenodd" />
						</svg>
					</div>
					<span class="text-sm font-medium">{$i18n.t('Enable Chatter Mode')}</span>
				</div>
				<Switch bind:state={config.enabled} />
			</div>

			{#if config.enabled}
				<!-- Schema selector -->
				<div>
					<label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider"
						>{$i18n.t('Schema')}</label
					>
					{#if schemaNames.length > 0}
						<div class="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 flex-wrap">
							{#each schemaNames as name}
								<button
									type="button"
									class="px-3.5 py-1 text-xs font-medium rounded-md transition-all duration-200 {config.schemaName === name
										? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-300 shadow-sm'
										: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
									on:click={() => (config.schemaName = name)}
								>
									{name}
								</button>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-gray-400 dark:text-gray-500 italic">{$i18n.t('Loading schemas...')}</p>
					{/if}
				</div>

				<!-- Domain -->
				<div>
					<label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider"
						>{$i18n.t('Domain')}</label
					>
					<div class="grid grid-cols-2 gap-2">
						<div class="relative">
							<input
								type="text"
								bind:value={config.domain.id}
								class="w-full text-xs px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
								placeholder="daily"
							/>
							<span class="absolute -top-1.5 left-2 text-[9px] bg-white dark:bg-gray-900 px-1 text-gray-400 dark:text-gray-500">ID</span>
						</div>
						<div class="relative">
							<input
								type="text"
								bind:value={config.domain.label}
								class="w-full text-xs px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
								placeholder="Daily Conversation"
							/>
							<span class="absolute -top-1.5 left-2 text-[9px] bg-white dark:bg-gray-900 px-1 text-gray-400 dark:text-gray-500">{$i18n.t('Label')}</span>
						</div>
					</div>
				</div>

				<!-- Scenario -->
				<div>
					<label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider"
						>{$i18n.t('Scenario')}</label
					>
					<textarea
						bind:value={config.scenario}
						class="w-full text-xs px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors resize-vertical placeholder:text-gray-400 dark:placeholder:text-gray-600 leading-relaxed"
						rows="3"
						placeholder={$i18n.t('Describe the scenario...')}
					/>
				</div>

				<!-- Characters section -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>{$i18n.t('Characters')}</label
						>
						<button
							type="button"
							class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300 hover:bg-violet-500/20 transition-colors font-medium"
							on:click={addCharacter}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3">
								<path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
							</svg>
							{$i18n.t('Add')}
						</button>
					</div>

					<div class="flex flex-col gap-2">
						{#each config.characters as char, idx}
							<div
								class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden border-l-[3px] {getCharAccent(idx)} transition-all duration-200"
							>
								<!-- Character header -->
								<div class="flex items-center justify-between px-3 py-2 bg-gray-50/50 dark:bg-gray-800/30">
									<div class="flex items-center gap-2">
										<div class="size-6 rounded-full {getCharBg(idx)} flex items-center justify-center text-[10px] font-bold text-white shrink-0">
											{getInitial(char)}
										</div>
										<span class="text-xs font-medium">{char.name || $i18n.t('Character')} #{idx + 1}</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded-full {char.role === 'assistant'
											? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
											: 'bg-amber-500/15 text-amber-600 dark:text-amber-300'}"
										>
											{char.role === 'assistant' ? $i18n.t('Assistant') : $i18n.t('User')}
										</span>
									</div>
									<button
										type="button"
										class="text-xs text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
										on:click={() => removeCharacter(idx)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3.5">
											<path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clip-rule="evenodd" />
										</svg>
									</button>
								</div>

								<!-- Character body -->
								<div class="px-3 py-2.5 flex flex-col gap-2.5">
									<div class="grid grid-cols-2 gap-2">
										<div class="relative">
												<input
												type="text"
												bind:value={char.id}
												list="chara-id-suggestions-{idx}"
												class="w-full text-xs px-2 py-1.5 rounded-md bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors"
												placeholder="ryza, user_00, etc."
											/>
											{#if schemaCharaIds.length > 0}
												<datalist id="chara-id-suggestions-{idx}">
													{#each schemaCharaIds as cid}
														<option value={cid} />
													{/each}
												</datalist>
											{/if}
											<span class="absolute -top-1.5 left-2 text-[9px] bg-white dark:bg-gray-900 px-0.5 text-gray-400 dark:text-gray-500">ID</span>
										</div>
										<div class="relative">
											<input
												type="text"
												bind:value={char.name}
												class="w-full text-xs px-2 py-1.5 rounded-md bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors"
												placeholder={$i18n.t('Name')}
											/>
											<span class="absolute -top-1.5 left-2 text-[9px] bg-white dark:bg-gray-900 px-0.5 text-gray-400 dark:text-gray-500">{$i18n.t('Name')}</span>
										</div>
									</div>

									<div class="relative">
										<textarea
											bind:value={char.description}
											class="w-full text-xs px-2 py-1.5 rounded-md bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors resize-vertical leading-relaxed"
											rows="2"
											placeholder={$i18n.t('Character description for [desc] tag')}
										/>
										<span class="absolute -top-1.5 left-2 text-[9px] bg-white dark:bg-gray-900 px-0.5 text-gray-400 dark:text-gray-500">{$i18n.t('Description')}</span>
									</div>

									<!-- Role selector - pill style -->
									<div class="flex items-center gap-1.5">
										<span class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">{$i18n.t('Role')}</span>
										<button
											type="button"
											class="text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 font-medium {char.role === 'assistant'
												? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/30'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
											on:click={() => { char.role = 'assistant'; config.characters = [...config.characters]; }}
										>
											{$i18n.t('Assistant')}
										</button>
										<button
											type="button"
											class="text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 font-medium {char.role === 'user'
												? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/30'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
											on:click={() => { char.role = 'user'; config.characters = [...config.characters]; }}
										>
											{$i18n.t('User')}
										</button>
									</div>

									</div>
							</div>
						{/each}
					</div>

					{#if config.characters.length === 0}
						<div class="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-8 mb-2 opacity-40">
								<path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
							</svg>
							<span class="text-xs">{$i18n.t('No characters yet')}</span>
						</div>
					{/if}
				</div>

				<!-- Active user character -->
				{#if config.characters.filter((c) => c.role === 'user').length > 0}
					<div>
						<label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider"
							>{$i18n.t('Active User Character')}</label
						>
						<select
							bind:value={config.activeUserCharaId}
							class="w-full text-xs px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 outline-none focus:border-violet-300 dark:focus:border-violet-500/50 transition-colors"
						>
							{#each config.characters.filter((c) => c.role === 'user') as char}
								<option value={char.id}>{char.name || char.id}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- System prompt preview -->
				<div>
					<Collapsible
						title={$i18n.t('System Prompt Preview')}
						bind:open={showPreview}
						buttonClassName="w-fit text-xs text-gray-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
					>
						<div slot="content" class="mt-1.5">
							<pre
								class="text-[11px] bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50 leading-relaxed text-gray-600 dark:text-gray-300 font-mono">{systemPromptPreview ||
									$i18n.t('Add characters to see preview')}</pre>
						</div>
					</Collapsible>
				</div>

				<!-- Save button -->
				<button
					type="button"
					class="w-full text-sm px-3 py-2 rounded-lg font-medium transition-all duration-200 {saving
						? 'bg-emerald-500 text-white'
						: 'bg-violet-500 text-white hover:bg-violet-600 active:scale-[0.98]'}"
					on:click={save}
					disabled={saving}
				>
					{saving ? $i18n.t('Saved') : $i18n.t('Save')}
				</button>
			{/if}
		</div>
	</Collapsible>
</div>
