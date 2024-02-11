import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  redirect(302, AppRoute.MEMORY);
}) satisfies PageLoad;
