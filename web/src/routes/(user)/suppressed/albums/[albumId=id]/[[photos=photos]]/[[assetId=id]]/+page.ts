import { getAlbumInfo, getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ params, url, depends }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  depends('suppressed-album:data');

  const album = await getAlbumInfo({ id: params.albumId, suppressedOnly: true });

  return {
    album,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
