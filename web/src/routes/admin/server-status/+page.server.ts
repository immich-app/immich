import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	const { data: stats } = await api.serverInfoApi.getStats();

	return {
		stats,
		meta: {
			title: 'Server Stats'
		}
	};
}) satisfies PageServerLoad;
