import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SystemConfigDto, SystemConfigTemplateStorageOptionDto } from '@api';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else if (!user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  const config: SystemConfigDto = await locals.api.systemConfigApi.getConfig().then((res) => res.data);
  const defaultConfig: SystemConfigDto = await locals.api.systemConfigApi.getDefaults().then((res) => res.data);
  const templateOptions: SystemConfigTemplateStorageOptionDto = await locals.api.systemConfigApi
    .getStorageTemplateOptions()
    .then((res) => res.data);

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
