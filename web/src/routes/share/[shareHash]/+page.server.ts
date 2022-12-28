import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { shareHash } = params;
	console.log('share page', shareHash);
};
