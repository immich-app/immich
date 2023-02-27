import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
	throw redirect(302, '/admin/user-management');
}) satisfies PageLoad;
