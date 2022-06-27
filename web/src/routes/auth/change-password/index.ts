import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';

export const post: RequestHandler = async ({ request, locals }) => {
	const form = await request.formData();

	const password = form.get('password');

	const payload = {
		id: locals.user?.id,
		password,
		shouldChangePassword: false,
	};

	const res = await fetch(`${serverEndpoint}/user`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${locals.user?.accessToken}`,
		},
		body: JSON.stringify(payload),
	});

	if (res.status === 200) {
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
				error: await res.json(),
			},
		};
	}
};
