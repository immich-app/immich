import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (() => {
  redirect(307, AppRoute.SHARED_LINKS);
}) satisfies PageLoad;
