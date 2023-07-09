import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: items } = await locals.api.searchApi.getExploreData();
  const { data: people } = await locals.api.personApi.getAllPeople();
  return {
    user,
    items,
    people,
    meta: {
      title: 'Explore',
    },
  };
}) satisfies PageServerLoad;
