import type { Handle, HandleServerError } from '@sveltejs/kit';
import { AxiosError } from 'axios';
import { env } from '$env/dynamic/public';
import { ImmichApi } from './api/api';

export const handle = (async ({ event, resolve }) => {
	event.locals.api = new ImmichApi({
		basePath: env.PUBLIC_IMMICH_SERVER_URL || 'http://immich-server:3001',
		accessToken: event.cookies.get('immich_access_token')
	});

	const res = await resolve(event);

	// The link header can grow quite big and has caused issues with our nginx
	// proxy returning a 502 Bad Gateway error. Therefore the header gets deleted.
	res.headers.delete('Link');

	return res;
}) satisfies Handle;

export const handleError: HandleServerError = async ({ error }) => {
	const httpError = error as AxiosError;
	return {
		message: httpError?.message || 'Hmm, not sure about that. Check the logs or open a ticket?',
		stack: httpError?.stack,
		code: httpError.code || '500'
	};
};
