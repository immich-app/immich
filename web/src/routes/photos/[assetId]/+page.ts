import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { browser } from '$app/env';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({}) => {
	//!TODO refactor session
	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// } else {
	// 	throw redirect(302, '/photos');
	// }

	redirect(302, '/photos');
};
