<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { i18n as i18nType } from 'i18next';

	import { chatterConfig, activeTalkTo } from '$lib/stores/chatter';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext<Writable<i18nType>>('i18n');

	$: userCharacters = $chatterConfig.characters.filter((c) => c.role === 'user');
	$: assistantCharacters = $chatterConfig.characters.filter((c) => c.role === 'assistant');

	$: activeUserChar = $chatterConfig.characters.find(
		(c) => c.id === $chatterConfig.activeUserCharaId
	);

	const dropdownArrowGray = "background-image: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\"); background-position: right 2px center; background-repeat: no-repeat; background-size: 14px;";
</script>

<div class="chatter-input-controls flex items-center gap-1 flex-wrap px-0.5 py-0.5">
	<!-- Talk-to -->
	{#if assistantCharacters.length > 0}
		<Tooltip content={$i18n.t('Talk to')} placement="top">
			<div class="inline-flex items-center gap-0.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-600/40 pl-1.5 pr-0.5 py-0.5 transition-colors hover:border-gray-300 dark:hover:border-gray-500/50">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3 text-gray-400 dark:text-gray-500 shrink-0">
					<path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.022h-.048c-1.907 0-3.78.118-5.602.343A3.4 3.4 0 008 8.311v1.91c0 .436.064.864.186 1.271A3.4 3.4 0 005.93 14.9H4.2a1.857 1.857 0 01-1.657-1.017 1.858 1.858 0 01-.038-1.56l.71-1.644a1.004 1.004 0 00.063-.457l-.17-2.11C2.827 5.762 2.9 3.616 3.505 2.365z" />
					<path d="M11.305 5.61C12.97 5.46 14.636 5.385 16.305 5.385h.048c.709 0 1.338.462 1.532 1.138l.216.758c.245.86.317 1.759.211 2.645l-.17 2.11a1.002 1.002 0 00.064.457l.71 1.644a1.86 1.86 0 01-1.696 2.578h-1.731A3.4 3.4 0 0012 13.527v-1.91a2.4 2.4 0 012-2.367c1.746-.215 3.526-.328 5.305-.343A2.4 2.4 0 0017 6.536a41.37 41.37 0 00-5.695-.926z" />
				</svg>
				<select
					bind:value={$activeTalkTo}
					class="text-xs pl-0.5 pr-4 py-0.5 bg-transparent outline-none text-gray-600 dark:text-gray-300 appearance-none cursor-pointer"
					style={dropdownArrowGray}
				>
					<option value="">{$i18n.t('Anyone')}</option>
					{#each assistantCharacters as char}
						<option value={char.id}>{char.name || char.id}</option>
					{/each}
				</select>
			</div>
		</Tooltip>
	{/if}

	<!-- User character indicator -->
	{#if userCharacters.length > 1}
		<Tooltip content={$i18n.t('Speaking as')} placement="top">
			<span
				class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 font-medium"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3">
					<path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z" />
				</svg>
				{activeUserChar?.name || $chatterConfig.activeUserCharaId}
			</span>
		</Tooltip>
	{/if}
</div>
