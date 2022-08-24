import { redirect } from '@sveltejs/kit';
export const prerender = false;
import { browser } from '$app/env';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	// !TODO refactor session
	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// }

	const albumId = params['albumId'];

	if (albumId) {
		throw redirect(302, `/albums/${albumId}`);
	} else {
		throw redirect(302, `/photos`);
	}
};
