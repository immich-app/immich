import { AppRoute } from '$lib/constants';
import { redirect } from "$lib/utils";
import type { PageLoad } from './$types';

export const load = (() => {
  redirect(302, AppRoute.ADMIN_USER_MANAGEMENT);
}) satisfies PageLoad;
