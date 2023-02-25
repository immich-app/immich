import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	try {
		const { data: user } = await api.userApi.getMyUserInfo();

		return { user };
	} catch (e) {
		console.error('[ERROR] layout.server.ts [LayoutServerLoad]: ');
		return { user: undefined };
	}
}) satisfies LayoutServerLoad;
