import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals: { api } }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: partner } = await api.userApi.getUserById({ id: params['userId'] });

  return {
    user,
    partner,
    meta: {
      title: 'Partner',
    },
  };
};
