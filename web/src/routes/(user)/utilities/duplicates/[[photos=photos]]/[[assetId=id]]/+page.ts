import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates, updateAssets, type DuplicateResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';

const rectifyDuplicate = (uniqueAssetIds: string[]) => {
  if (uniqueAssetIds.length > 0) {
    updateAssets({ assetBulkUpdateDto: { ids: uniqueAssetIds, duplicateId: null } });
  }
};

const processDuplicates = (duplicates: DuplicateResponseDto[]) => {
  let uniqueAssetIds: string[] = [];
  const validDuplicates = duplicates.filter((duplicate) => {
    if (duplicate.assets.length <= 1) {
      uniqueAssetIds.push(duplicate.assets[0].id);
      return false;
    }
    return true;
  });
  rectifyDuplicate(uniqueAssetIds);
  return validDuplicates;
};

export const load = (async ({ params }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const Allduplicates = await getAssetDuplicates();
  const duplicates = processDuplicates(Allduplicates);
  const $t = await getFormatter();

  return {
    asset,
    duplicates,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
