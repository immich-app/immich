import type { Handle, HandleServerError } from '@sveltejs/kit';
import { AxiosError } from 'axios';

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};

export const handleError: HandleServerError = async ({ error }) => {
	const httpError = error as AxiosError;
	return {
		message: httpError?.message || 'Hmm, not sure about that. Check the logs or open a ticket?',
		stack: httpError?.stack,
		code: httpError.code || '500'
	};
};
