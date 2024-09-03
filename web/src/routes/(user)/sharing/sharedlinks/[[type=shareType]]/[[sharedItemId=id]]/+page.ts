import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAlbumInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  if (params.type === 'album' && params.sharedItemId) {
    await getAlbumInfo({ id: params.sharedItemId, withoutAssets: true });
  } else if (params.type === 'individual') {
    await getAssetInfoFromParam({ assetId: params.sharedItemId });
  }
  const $t = await getFormatter();

  return {
    sharedItem: {
      type: params.type,
      id: params.sharedItemId,
    },
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies PageLoad;
