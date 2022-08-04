import { serverApi } from '@api';

export const GET = async () => {
	try {
		const { data } = await serverApi.userApi.getMyUserInfo();
		return {
			body: data
		};
	} catch {
		return {
			status: 500,
			body: 'Cannot get user info'
		};
	}
};
