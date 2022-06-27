import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';
import * as cookie from 'cookie';
import { getRequest, putRequest } from '$lib/api';

type AuthUser = {
	accessToken: string;
	userId: string;
	userEmail: string;
	firstName: string;
	lastName: string;
	isAdmin: boolean;
	shouldChangePassword: boolean;
};

export const post: RequestHandler = async ({ request }) => {
	const form = await request.formData();

	const email = form.get('email');
	const password = form.get('password');

	const payload = {
		email,
		password,
	};

	const res = await fetch(`${serverEndpoint}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (res.status === 201) {
		// Login success
		const authUser = (await res.json()) as AuthUser;

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
					shouldChangePassword: authUser.shouldChangePassword,
				},
				success: 'success',
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
						email: authUser.userEmail,
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
	} else {
		return {
			status: 400,
			body: {
				error: 'Incorrect email or password',
			},
		};
	}
};
