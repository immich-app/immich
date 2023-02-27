import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { api } }) => {
	const { data: jobs } = await api.jobApi.getAllJobsStatus();

	return {
		jobs,
		meta: {
			title: 'Job Status'
		}
	};
};
