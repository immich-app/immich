import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const { data: keys } = await locals.api.keyApi.getApiKeys();
  const { data: devices } = await locals.api.authenticationApi.getAuthDevices();
  const { data: partners } = await locals.api.partnerApi.getPartners({ direction: 'shared-by' });

  return {
    user,
    keys,
    devices,
    partners,
    meta: {
      title: 'Settings',
    },
  };
}) satisfies PageServerLoad;
