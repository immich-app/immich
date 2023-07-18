import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: items } = await locals.api.searchApi.getExploreData();
  const { data: response } = await locals.api.personApi.getAllPeople({ withHidden: false });
  return {
    user,
    items,
    response,
    meta: {
      title: 'Explore',
    },
  };
}) satisfies PageServerLoad;
