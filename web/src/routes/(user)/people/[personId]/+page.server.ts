import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent, params }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: person } = await locals.api.personApi.getPerson({ id: params.personId });

  return {
    user,
    person,
    meta: {
      title: person.name || 'Person',
    },
  };
}) satisfies PageServerLoad;
