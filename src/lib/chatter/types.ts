// Schema/tag metadata from backend API
export type TagInfo = {
	name: string;
	field_name: string | null;
	pattern_type: string;
	speaker_internal: boolean;
	scope: string;
	values: string[];
	default: any;
	order: number;
};

export type SchemaInfo = {
	name: string;
	version: string;
	tags: TagInfo[];
};

export type ChatterCharacter = {
	id: string;
	name: string;
	description: string;
	role: 'assistant' | 'user';
	avatarColor?: string;
};

export type ChatterDomain = {
	id: string;
	label: string;
};

export type ChatterConfig = {
	enabled: boolean;
	schemaName: string;
	domain: ChatterDomain;
	scenario: string;
	characters: ChatterCharacter[];
	activeUserCharaId: string;
};

export type ChatterParsedTurn = {
	domain?: string;
	charaId: string;
	attitude?: string;
	emotion?: string;
	intent?: string;
	content: string;
	reflection?: string;
	talkTo?: string;
	raw: string;
};

export type ChatterParsedResponse = {
	turns: ChatterParsedTurn[];
	rawContent: string;
	partial: boolean;
};

export const DEFAULT_CHATTER_CONFIG: ChatterConfig = {
	enabled: false,
	schemaName: 'geppetto2-v3',
	domain: { id: 'daily', label: 'Daily Conversation' },
	scenario: '',
	characters: [],
	activeUserCharaId: ''
};
