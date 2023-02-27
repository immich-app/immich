import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { api } }) => {
	const { data: config } = await api.systemConfigApi.getConfig();

	return {
		config,
		meta: {
			title: 'System Settings'
		}
	};
};
