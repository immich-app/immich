import { redirect } from '@sveltejs/kit';
import { api, UserResponseDto } from '@api';
import { browser } from '$app/env';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	// !TODO refactor session

	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// }

	try {
		const user: UserResponseDto = await fetch('/data/user/get-my-user-info').then((r) => r.json());
		const allUsers: UserResponseDto[] = await fetch('/data/user/get-all-users?isAll=false').then(
			(r) => r.json()
		);

		if (!user.isAdmin) {
			throw redirect(302, '/photos');
		}

		return {
			user: user,
			allUsers: allUsers
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
