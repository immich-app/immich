import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';
import { immichApi } from '$lib/immich-api';

export const post: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return {
			status: 401,
			body: {
				error: 'Unauthorized',
			},
		};
	}

	const form = await request.formData();
	const password = form.get('password');

	immichApi.setAccessToken(locals.user.accessToken);
	const { status } = await immichApi.userApi.updateUser({
		id: locals.user.id,
		password: String(password),
		shouldChangePassword: false,
	});

	if (status === 200) {
		return {
			status: 200,
			body: {
				success: 'Succesfully change password',
			},
		};
	} else {
		return {
			status: 400,
			body: {
				error: 'Error change password',
			},
		};
	}
};
