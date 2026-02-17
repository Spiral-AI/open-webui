import { writable, derived } from 'svelte/store';
import { settings } from '$lib/stores';
import { DEFAULT_CHATTER_CONFIG } from '$lib/chatter';
import type { ChatterConfig, SchemaInfo } from '$lib/chatter';

// Backend schema metadata (fetched on app mount)
export const chatterSchemas = writable<SchemaInfo[]>([]);

export const chatterConfig = derived<typeof settings, ChatterConfig>(settings, ($settings) => {
	const raw = $settings.chatter;
	if (!raw) return DEFAULT_CHATTER_CONFIG;

	// Migrate legacy schemaVersion → schemaName
	if ('schemaVersion' in raw && !('schemaName' in raw)) {
		return {
			...DEFAULT_CHATTER_CONFIG,
			...raw,
			schemaName: `geppetto2-${(raw as any).schemaVersion ?? 'v3'}`
		};
	}
	return { ...DEFAULT_CHATTER_CONFIG, ...raw };
});

export const chatterEnabled = derived(chatterConfig, ($config) => $config?.enabled ?? false);

// Per-message ephemeral state (not persisted)
export const activeTalkTo = writable<string>('');

// Debug: last messages payload sent to LLM
export const lastChatterPayload = writable<any[]>([]);
