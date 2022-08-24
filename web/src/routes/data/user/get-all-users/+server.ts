import { json } from '@sveltejs/kit';
import { serverApi, UserResponseDto } from '@api';
import type { RequestEvent, RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async ({url} : RequestEvent): Promise<RequestHandlerOutput<UserResponseDto[]>> => {
	try {
    const isAll = url.searchParams.get('isAll') === 'true';

		const { data } = await serverApi.userApi.getAllUsers(isAll);
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return json(data);
		return {
			body: data
		};
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
