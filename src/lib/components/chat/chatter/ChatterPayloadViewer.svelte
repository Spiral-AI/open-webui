<script lang="ts">
	import { lastChatterPayload } from '$lib/stores/chatter';

	let open = false;
</script>

{#if $lastChatterPayload.length > 0}
	<div class="chatter-payload-viewer w-full">
		<button
			type="button"
			class="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors py-1"
			on:click={() => (open = !open)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="size-3 transition-transform {open ? 'rotate-90' : ''}"
			>
				<path
					fill-rule="evenodd"
					d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="font-mono">Messages Payload ({$lastChatterPayload.length})</span>
		</button>

		{#if open}
			<pre
				class="text-[11px] bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50 leading-relaxed text-gray-600 dark:text-gray-300 font-mono"
			>{JSON.stringify($lastChatterPayload, null, 2)}</pre>
		{/if}
	</div>
{/if}
