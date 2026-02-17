<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { i18n as i18nType } from 'i18next';

	import Markdown from '../Messages/Markdown.svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';

	import type { ChatterParsedTurn, ChatterConfig } from '$lib/chatter';

	const i18n = getContext<Writable<i18nType>>('i18n');

	export let turns: ChatterParsedTurn[] = [];
	export let config: ChatterConfig;
	export let streaming = false;
	export let isUser = false;
	export let chatId = '';
	export let messageId = '';
	export let rawContent = '';

	const CHARA_COLORS = [
		{ bg: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-200', border: 'border-l-blue-400' },
		{ bg: 'bg-purple-500', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-200', border: 'border-l-purple-400' },
		{ bg: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200', border: 'border-l-emerald-400' },
		{ bg: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-200', border: 'border-l-orange-400' },
		{ bg: 'bg-pink-500', badge: 'bg-pink-500/15 text-pink-700 dark:text-pink-200', border: 'border-l-pink-400' },
		{ bg: 'bg-cyan-500', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-200', border: 'border-l-cyan-400' }
	];

	function resolveCharaId(charaId: string): string {
		if (charaId) return charaId;
		const targetRole = isUser ? 'user' : 'assistant';
		const char = config.characters.find((c) => c.role === targetRole);
		return char?.id ?? '';
	}

	function getCharaName(charaId: string): string {
		const resolved = resolveCharaId(charaId);
		const char = config.characters.find((c) => c.id === resolved);
		return char?.name ?? resolved;
	}

	function getInitial(charaId: string): string {
		const name = getCharaName(charaId);
		return (name || '?')[0].toUpperCase();
	}

	function isCustomColor(color: string): boolean {
		return color.startsWith('#') || color.startsWith('rgb');
	}

	function getCharaColorSet(charaId: string): typeof CHARA_COLORS[0] {
		const resolved = resolveCharaId(charaId);
		const idx = config.characters.findIndex((c) => c.id === resolved);
		return CHARA_COLORS[idx >= 0 ? idx % CHARA_COLORS.length : 0];
	}

	function getCharaStyle(charaId: string): string {
		const resolved = resolveCharaId(charaId);
		const char = config.characters.find((c) => c.id === resolved);
		if (char?.avatarColor && isCustomColor(char.avatarColor)) {
			return `background-color: ${char.avatarColor}20; color: ${char.avatarColor};`;
		}
		return '';
	}

	function getAvatarStyle(charaId: string): string {
		const resolved = resolveCharaId(charaId);
		const char = config.characters.find((c) => c.id === resolved);
		if (char?.avatarColor && isCustomColor(char.avatarColor)) {
			return `background-color: ${char.avatarColor};`;
		}
		return '';
	}

	function emotionIcon(emotion: string): string {
		if (!emotion) return '';
		const category = emotion.split('_')[0];
		const icons: Record<string, string> = {
			happy: '\u2727',
			neutral: '\u25CB',
			sad: '\u2734',
			angry: '\u2666',
			surprised: '\u25C7'
		};
		return icons[category] ?? '';
	}
</script>

<div class="chatter-message-display flex flex-col gap-2.5">
	{#each turns as turn, i}
		{@const effectiveCharaId = resolveCharaId(turn.charaId)}
		{@const colors = getCharaColorSet(effectiveCharaId)}
		<div class="chatter-turn {turns.length > 1 ? `border-l-2 ${colors.border} pl-2.5` : ''}">
			<!-- Header: avatar + character badge, emotion, talk_to -->
			<div class="flex items-center gap-1.5 mb-1 flex-wrap">
				{#if effectiveCharaId}
					<div class="inline-flex items-center gap-1.5">
						<!-- Avatar initial -->
						<div
							class="size-5 rounded-full {colors.bg} flex items-center justify-center text-[9px] font-bold text-white shrink-0"
							style={getAvatarStyle(effectiveCharaId)}
						>
							{getInitial(turn.charaId)}
						</div>
						<!-- Name badge -->
						<span
							class="text-xs font-semibold {colors.badge} px-1.5 py-0.5 rounded-md"
							style={getCharaStyle(effectiveCharaId)}
						>
							{getCharaName(turn.charaId)}
						</span>
					</div>
				{/if}

				{#if turn.emotion && !isUser}
					<span
						class="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
					>
						<span class="opacity-60">{emotionIcon(turn.emotion)}</span>
						{turn.emotion.replace('_', ' ')}
					</span>
				{/if}

				{#if turn.attitude && turn.attitude !== 'idle' && !isUser}
					<span
						class="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-850 text-gray-400 dark:text-gray-500 italic"
					>
						{turn.attitude}
					</span>
				{/if}

				{#if turn.talkTo}
					<span class="inline-flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3 opacity-50">
							<path fill-rule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clip-rule="evenodd" />
						</svg>
						{getCharaName(turn.talkTo)}
					</span>
				{/if}
			</div>

			<!-- Utterance content -->
			{#if turn.content}
				<div class="chatter-utterance {isUser ? '' : 'pl-0.5'}">
					<Markdown
						id="{chatId}-{messageId}-chatter-{i}"
						content={turn.content}
						done={!streaming || i !== turns.length - 1}
					/>
				</div>
			{:else if streaming && i === turns.length - 1}
				<div class="flex items-center gap-1 py-1">
					<span class="size-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms"></span>
					<span class="size-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms"></span>
					<span class="size-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms"></span>
				</div>
			{/if}

			<!-- Collapsible sections for intent and reflection (assistant only) -->
			{#if !isUser}
				{#if turn.intent}
					<div class="mt-1.5">
						<Collapsible
							title={$i18n.t('Intent')}
							buttonClassName="w-fit inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
						>
							<div slot="content" class="text-xs text-gray-500 dark:text-gray-400 pl-2.5 py-1.5 border-l border-violet-200 dark:border-violet-500/30 ml-0.5 mt-1 leading-relaxed">
								{turn.intent}
							</div>
						</Collapsible>
					</div>
				{/if}

				{#if turn.reflection}
					<div class="mt-1">
						<Collapsible
							title={$i18n.t('Reflection')}
							buttonClassName="w-fit inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
						>
							<div slot="content" class="text-xs text-gray-500 dark:text-gray-400 pl-2.5 py-1.5 border-l border-gray-200 dark:border-gray-700 ml-0.5 mt-1 leading-relaxed italic">
								{turn.reflection}
							</div>
						</Collapsible>
					</div>
				{/if}
			{/if}
		</div>

		{#if i < turns.length - 1}
			<div class="h-px bg-gradient-to-r from-gray-200/60 via-gray-200/30 to-transparent dark:from-gray-700/60 dark:via-gray-700/30" />
		{/if}
	{/each}

	<!-- Raw tagged prompt -->
	{#if rawContent}
		<div class="mt-2">
			<Collapsible
				title={$i18n.t('Raw')}
				buttonClassName="w-fit inline-flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
			>
				<div slot="content" class="mt-1 ml-0.5">
					<pre class="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-850 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all font-mono border border-gray-100 dark:border-gray-800">{rawContent}</pre>
				</div>
			</Collapsible>
		</div>
	{/if}
</div>
