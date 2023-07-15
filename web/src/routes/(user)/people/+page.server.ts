import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: people } = await locals.api.personApi.getAllPeople({ areHidden: false });
  const { data: countpeople } = await locals.api.personApi.getPersonCount();
  return {
    user,
    people,
    countpeople,
    meta: {
      title: 'People',
    },
  };
}) satisfies PageServerLoad;
