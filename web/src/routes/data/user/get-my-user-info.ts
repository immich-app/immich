import { serverApi, UserResponseDto } from '@api';
import type { RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async (): Promise<RequestHandlerOutput<UserResponseDto>> => {
	try {
		const { data } = await serverApi.userApi.getMyUserInfo();
		return {
			body: data
		};
	} catch {
		return {
			status: 500
		};
	}
};
