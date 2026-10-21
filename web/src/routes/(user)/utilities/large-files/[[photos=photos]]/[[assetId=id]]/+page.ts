import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { AssetOrder, AssetVisibility, SearchOrderField, getAuthStatus, searchAssets } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const { isElevated } = await getAuthStatus();
  const {
    assets: { items: assets },
  } = await searchAssets({
    metadataSearchDto: {
      filter: {
        fileSizeInBytes: { gt: 0 },
        visibility: { notIn: isElevated ? [AssetVisibility.Hidden] : [AssetVisibility.Hidden, AssetVisibility.Locked] },
        trashedAt: { eq: null },
      },
      orderBy: { field: SearchOrderField.FileSizeInBytes, direction: AssetOrder.Desc },
      withExif: true,
    },
  });
  const $t = await getFormatter();

  return {
    assets,
    meta: {
      title: $t('large_files'),
    },
  };
}) satisfies PageLoad;
