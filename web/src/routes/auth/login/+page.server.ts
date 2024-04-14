import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load = (async ({ cookies }) => {
  if (env.IMMICH_TRUSTED_REMOTE_NETWORKS) {
    [
      ['immich_auth_type', 'trusted-header-auth'],
      ['immich_is_authenticated', 'true']
    ].forEach(([key, value]) => {
      cookies.set(
        key, value,
        {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          secure: false,
          maxAge: 60 * 60 * 24 * 30
        },
      )
    });
    redirect(302, AppRoute.PHOTOS);
  }
}) satisfies PageServerLoad;
