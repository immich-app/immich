import type { RequestHandler } from '@sveltejs/kit';
import { api } from '@api';

export const post: RequestHandler = async ({ request }) => {
	const form = await request.formData();

	const email = form.get('email');
	const password = form.get('password');
	const firstName = form.get('firstName');
	const lastName = form.get('lastName');

	const { status } = await api.userApi.createUser({
		email: String(email),
		password: String(password),
		firstName: String(firstName),
		lastName: String(lastName),
	});

	if (status === 201) {
		return {
			status: 201,
			body: {
				success: 'Succesfully create user account',
			},
		};
	} else {
		return {
			status: 400,
			body: {
				error: 'Error create user account',
			},
		};
	}
};
