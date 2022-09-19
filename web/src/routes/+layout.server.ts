import { serverApi } from '@api';
import * as cookieParser from 'cookie';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	try {
		const cookies = cookieParser.parse(request.headers.get('cookie') || '');
		const accessToken = cookies['immich_access_token'];

		if (!accessToken) {
			return {
				user: undefined
			};
		}

		serverApi.setAccessToken(accessToken);
		const { data: userInfo } = await serverApi.userApi.getMyUserInfo();

		return {
			user: userInfo
		};
	} catch (e) {
		console.error('[ERROR] layout.server.ts [LayoutServerLoad]: ', e);
		return {
			user: undefined
		};
	}
};
