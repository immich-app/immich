import { getAllAlbums, getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  const [ownedAlbums, sharedAlbums] = await Promise.all([
    getAllAlbums({ suppressedOnly: true }),
    getAllAlbums({ shared: true, suppressedOnly: true }),
  ]);
  const $t = await getFormatter();

  return {
    ownedAlbums: ownedAlbums.filter((album) => album.assetCount > 0),
    sharedAlbums: sharedAlbums.filter((album) => album.assetCount > 0),
    tab: url.searchParams.get('tab') === 'albums' ? 'albums' : 'timeline',
    meta: {
      title: $t('suppressed_content'),
    },
  };
}) satisfies PageLoad;
