export const prerender = false;
import { error } from '@sveltejs/kit';

import { serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { key } = params;

	try {
		const { data: sharedLink } = await serverApi.shareApi.getMySharedLink({ params: { key } });
		return { sharedLink };
	} catch (e) {
		throw error(404, {
			message: 'Invalid shared link'
		});
	}
};
