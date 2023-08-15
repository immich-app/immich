import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { APIKeyResponseDto, AuthDeviceResponseDto, UserResponseDto } from '@api';

export const load = (async ({ locals: { user }, locals }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }
  let keys: APIKeyResponseDto[] = [];
  let devices: AuthDeviceResponseDto[] = [];
  let partners: UserResponseDto[] = [];
  let oauthEnabled = false;

  [keys, devices, partners, oauthEnabled] = await Promise.all([
    locals.api.keyApi.getKeys().then((res) => res.data),
    locals.api.authenticationApi.getAuthDevices().then((res) => res.data),
    locals.api.partnerApi.getPartners({ direction: 'shared-by' }).then((res) => res.data),
    locals.api.systemConfigApi.getConfig().then((res) => res.data.oauth.enabled),
  ]);

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
