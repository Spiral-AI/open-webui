import type { ChatterParsedTurn, ChatterParsedResponse } from './types';

const VALUE_TAG_RE = /\[(domain|chara|attitude|emotion):([^\]]+)\]/g;
const BLOCK_TAG_RE = /\[(utterance|intent|reflection|talk_to)\]([\s\S]*?)\[\/\1\]/g;
const CHARA_SPLIT_RE = /(?=\[chara:[^\]]+\])/;

function parseSingleTurn(segment: string): ChatterParsedTurn {
	const turn: ChatterParsedTurn = {
		charaId: '',
		content: '',
		raw: segment
	};

	// Extract value tags
	let match: RegExpExecArray | null;
	const valueRe = new RegExp(VALUE_TAG_RE.source, 'g');
	while ((match = valueRe.exec(segment)) !== null) {
		const [, tag, value] = match;
		switch (tag) {
			case 'domain':
				turn.domain = value;
				break;
			case 'chara':
				turn.charaId = value;
				break;
			case 'attitude':
				turn.attitude = value;
				break;
			case 'emotion':
				turn.emotion = value;
				break;
		}
	}

	// Extract block tags
	const blockRe = new RegExp(BLOCK_TAG_RE.source, 'gs');
	while ((match = blockRe.exec(segment)) !== null) {
		const [, tag, value] = match;
		switch (tag) {
			case 'utterance':
				turn.content = value.trim();
				break;
			case 'intent':
				turn.intent = value.trim();
				break;
			case 'reflection':
				turn.reflection = value.trim();
				break;
			case 'talk_to':
				turn.talkTo = value.trim();
				break;
		}
	}

	// If no utterance block found, try to extract trailing text as content (partial/streaming)
	if (!turn.content) {
		// Remove all known tags and use remaining text
		let remaining = segment
			.replace(/\[(domain|chara|attitude|emotion):[^\]]+\]/g, '')
			.replace(/\[(utterance|intent|reflection|talk_to)\][\s\S]*?\[\/\1\]/g, '')
			.trim();

		// Check for unclosed utterance tag
		const unclosedMatch = segment.match(/\[utterance\]([\s\S]*)$/);
		if (unclosedMatch) {
			remaining = unclosedMatch[1].trim();
		}

		if (remaining) {
			turn.content = remaining;
		}
	}

	return turn;
}

const CHATTER_TAG_RE = /\[(chara|domain|attitude|emotion|utterance|intent|reflection|talk_to)[:\]]/;

export function parseChatterResponse(
	rawContent: string,
	_version: string
): ChatterParsedResponse {
	const hasChatterTags = CHATTER_TAG_RE.test(rawContent);

	if (!rawContent || !hasChatterTags) {
		return {
			turns: [
				{
					charaId: '',
					content: rawContent,
					raw: rawContent
				}
			],
			rawContent,
			partial: false
		};
	}

	// Detect partial: unclosed block tags
	const openTags = (rawContent.match(/\[(utterance|intent|reflection|talk_to)\]/g) || []).length;
	const closeTags = (
		rawContent.match(/\[\/(utterance|intent|reflection|talk_to)\]/g) || []
	).length;
	const partial = openTags > closeTags;

	if (rawContent.includes('[chara:')) {
		// Split by [chara:xxx] boundaries
		const segments = rawContent.split(CHARA_SPLIT_RE).filter((s) => s.trim());
		const turns = segments.map(parseSingleTurn).filter((t) => t.charaId);

		return {
			turns:
				turns.length > 0 ? turns : [{ charaId: '', content: rawContent, raw: rawContent }],
			rawContent,
			partial
		};
	}

	// No [chara:] tag but has other chatter tags (e.g. model only outputs [intent]/[reflection])
	const turn = parseSingleTurn(rawContent);

	// If no utterance content, promote reflection or intent to main content
	if (!turn.content) {
		if (turn.reflection) {
			turn.content = turn.reflection;
			turn.reflection = undefined;
		} else if (turn.intent) {
			turn.content = turn.intent;
			turn.intent = undefined;
		}
	}

	return {
		turns: [turn],
		rawContent,
		partial
	};
}
