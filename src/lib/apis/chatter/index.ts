import { WEBUI_API_BASE_URL } from '$lib/constants';

export const getChatterSchemas = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chatter/schemas`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const serializeChatterMessage = async (
	token: string,
	payload: { schema_name: string; text: string; domain: string; chara_id: string }
) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chatter/serialize`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(payload)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res?.result ?? '';
};

export const buildChatterSystemPromptAPI = async (
	token: string,
	payload: {
		schema_name: string;
		characters: { id: string; description?: string }[];
		scenario?: string;
		domain?: string;
	}
) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chatter/system-prompt`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(payload)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res?.result ?? '';
};
