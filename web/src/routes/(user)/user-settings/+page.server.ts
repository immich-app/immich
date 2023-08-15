import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { APIKeyResponseDto, AuthDeviceResponseDto, UserResponseDto } from '@api';

export const load = (async ({ locals: { user }, locals }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const keys: APIKeyResponseDto[] = await locals.api.keyApi.getKeys().then((res) => res.data);
  const devices: AuthDeviceResponseDto[] = await locals.api.authenticationApi.getAuthDevices().then((res) => res.data);
  const partners: UserResponseDto[] = await locals.api.partnerApi
    .getPartners({ direction: 'shared-by' })
    .then((res) => res.data);
  const oauthEnabled = await locals.api.systemConfigApi.getConfig().then((res) => res.data.oauth.enabled);

  return {
    user,
    keys,
    devices,
    partners,
    oauthEnabled,
    meta: {
      title: 'Settings',
    },
  };
}) satisfies PageServerLoad;
