import { redirect } from '@sveltejs/kit';
import { api, UserResponseDto } from '@api';
import { browser } from '$app/env';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else if (!user.isAdmin) {
		throw redirect(302, '/photos');
	}

	const allUsers: UserResponseDto[] = await fetch('/data/user/get-all-users?isAll=false').then(
		(r) => r.json()
	);

	return {
		user: user,
		allUsers: allUsers
	};
};
