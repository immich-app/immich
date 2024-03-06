import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  redirect(302, `${AppRoute.PEOPLE}/${params.personId}`);
}) satisfies PageLoad;
