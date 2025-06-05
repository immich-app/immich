import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (() => redirect(307, AppRoute.ADMIN_USERS)) satisfies PageLoad;
