import { api } from '@api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	try {
		const accessToken = cookies.get('immich_access_token');
		if (!accessToken) {
			return { user: undefined };
		}

		api.setAccessToken(accessToken);
		const { data: user } = await api.userApi.getMyUserInfo();

		return { user };
	} catch (e) {
		console.error('[ERROR] layout.server.ts [LayoutServerLoad]: ');
		return { user: undefined };
	}
}) satisfies LayoutServerLoad;
