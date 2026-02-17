<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { i18n as i18nType } from 'i18next';

	import { settings } from '$lib/stores';
	import { chatterEnabled } from '$lib/stores/chatter';
	import { DEFAULT_CHATTER_CONFIG } from '$lib/chatter';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext<Writable<i18nType>>('i18n');

	function toggle() {
		const current = $settings.chatter ?? DEFAULT_CHATTER_CONFIG;
		$settings = {
			...$settings,
			chatter: { ...current, enabled: !current.enabled }
		};
	}
</script>

<Tooltip content={$i18n.t('Chatter Mode')} placement="top">
	<button
		on:click|preventDefault={toggle}
		type="button"
		class="group p-[7px] flex gap-1.5 items-center text-sm rounded-full transition-colors duration-300 focus:outline-hidden max-w-full overflow-hidden {$chatterEnabled
			? 'text-violet-500 dark:text-violet-300 bg-violet-50 hover:bg-violet-100 dark:bg-violet-400/10 dark:hover:bg-violet-600/10 border border-violet-200/40 dark:border-violet-500/20'
			: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
		>
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
			<path d="M8 10h.01" />
			<path d="M12 10h.01" />
			<path d="M16 10h.01" />
		</svg>
	</button>
</Tooltip>
