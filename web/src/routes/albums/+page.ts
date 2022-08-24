import { redirect } from '@sveltejs/kit';
export const prerender = false;

import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
import { ImmichUser } from '$lib/models/immich-user';
import type { PageLoad } from './$types';
import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
import { AlbumResponseDto, api, UserResponseDto } from '@api';
import { browser } from '$app/env';

export const load: PageLoad = async ({ fetch }) => {
	// !TODO refactor session
	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// }

	try {
		const [user, albums] = await Promise.all([
			fetch('/data/user/get-my-user-info').then((r) => r.json() as Promise<UserResponseDto>),
			fetch('/data/album/get-all-albums').then((r) => r.json() as Promise<AlbumResponseDto[]>)
		]);

		return {
			user: user,
			albums: albums
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
