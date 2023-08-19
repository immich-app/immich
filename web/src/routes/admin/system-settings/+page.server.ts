import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else if (!user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  const { data: config } = await locals.api.systemConfigApi.getConfig();
  const { data: defaultConfig } = await locals.api.systemConfigApi.getDefaults();
  const { data: templateOptions } = await locals.api.systemConfigApi.getStorageTemplateOptions();
  return {
    user,
    config,
    defaultConfig,
    templateOptions,
    meta: {
      title: 'System Settings',
    },
  };
};
