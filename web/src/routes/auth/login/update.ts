import type { RequestHandler } from '@sveltejs/kit';
import { putRequest } from '../../../lib/api';
import * as cookie from 'cookie';

export const post: RequestHandler = async ({ request, locals }) => {
	const form = await request.formData();

	const firstName = form.get('firstName');
	const lastName = form.get('lastName');

	if (locals.user) {
		const updatedUser = await putRequest(
			'user',
			{
				id: locals.user.id,
				firstName,
				lastName,
			},
			locals.user.accessToken,
		);

		return {
			status: 200,
			body: {
				user: {
					id: updatedUser.id,
					accessToken: locals.user.accessToken,
					firstName: updatedUser.firstName,
					lastName: updatedUser.lastName,
					isAdmin: updatedUser.isAdmin,
					email: updatedUser.email,
				},
				success: 'Update user success',
			},
			headers: {
				'Set-Cookie': cookie.serialize(
					'session',
					JSON.stringify({
						id: updatedUser.id,
						accessToken: locals.user.accessToken,
						firstName: updatedUser.firstName,
						lastName: updatedUser.lastName,
						isAdmin: updatedUser.isAdmin,
						email: updatedUser.email,
					}),
					{
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						maxAge: 60 * 60 * 24 * 30,
					},
				),
			},
		};
	}

	return {
		status: 400,
		body: {
			error: 'Cannot get access token from cookies',
		},
	};
};
