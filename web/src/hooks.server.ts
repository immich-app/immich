import { env } from '$env/dynamic/public';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import type { AxiosError, AxiosResponse } from 'axios';
import { ImmichApi } from './api/api';

export const handle = (async ({ event, resolve }) => {
	const basePath = env.PUBLIC_IMMICH_SERVER_URL || 'http://immich-server:3001';
	const accessToken = event.cookies.get('immich_access_token');
	const api = new ImmichApi({ basePath, accessToken });

	// API instance that should be used for all server-side requests.
	event.locals.api = api;

	if (accessToken) {
		try {
			const { data: user } = await api.userApi.getMyUserInfo();
			event.locals.user = user;
		} catch (err) {
			const apiError = err as AxiosError;

			// Ignore 401 unauthorized errors and log all others.
			if (apiError.response?.status !== 401) {
				console.error('[ERROR] hooks.server.ts [handle]:', err);
			}
		}
	}

	const res = await resolve(event);

	// The link header can grow quite big and has caused issues with our nginx
	// proxy returning a 502 Bad Gateway error. Therefore the header gets deleted.
	res.headers.delete('Link');

	return res;
}) satisfies Handle;

const DEFAULT_MESSAGE = 'Hmm, not sure about that. Check the logs or open a ticket?';

export const handleError: HandleServerError = async ({ error }) => {
	const httpError = error as AxiosError;
	const response = httpError?.response as AxiosResponse<{
		message: string;
		statusCode: number;
		error: string;
	}>;

	let code = response?.data?.statusCode || response?.status || httpError.code || '500';
	if (response) {
		code += ` - ${response.data?.error || response.statusText}`;
	}

	return {
		message: response?.data?.message || httpError?.message || DEFAULT_MESSAGE,
		code,
		stack: httpError?.stack
	};
};
