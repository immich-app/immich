import { serverApi, UserResponseDto } from '@api';
import type { RequestEvent, RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async ({url} : RequestEvent): Promise<RequestHandlerOutput<UserResponseDto[]>> => {
	try {
    const isAll = url.searchParams.get('isAll') === 'true';

		const { data } = await serverApi.userApi.getAllUsers(isAll);
		return {
			body: data
		};
	} catch {
		return {
			status: 500
		};
	}
};
