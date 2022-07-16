import type { RequestHandler } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { api } from '@api';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();

	const email = form.get('email');
	const password = form.get('password');

	try {
		const { data: authUser } = await api.authenticationApi.login({
			email: String(email),
			password: String(password)
		});

		return {
			status: 200,
			body: {
				user: {
					id: authUser.userId,
					accessToken: authUser.accessToken,
					firstName: authUser.firstName,
					lastName: authUser.lastName,
					isAdmin: authUser.isAdmin,
					email: authUser.userEmail,
					shouldChangePassword: authUser.shouldChangePassword
				},
				success: 'success'
			},
			headers: {
				'Set-Cookie': cookie.serialize(
					'session',
					JSON.stringify({
						id: authUser.userId,
						accessToken: authUser.accessToken,
						firstName: authUser.firstName,
						lastName: authUser.lastName,
						isAdmin: authUser.isAdmin,
						email: authUser.userEmail
					}),
					{
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						maxAge: 60 * 60 * 24 * 30
					}
				)
			}
		};
	} catch (error) {
		return {
			status: 400,
			body: {
				error: 'Incorrect email or password'
			}
		};
	}
};
