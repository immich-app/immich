import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates, updateAssets, type DuplicateResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';

const rectifyDuplicate = (duplicate: DuplicateResponseDto) => {
  updateAssets({ assetBulkUpdateDto: { ids: duplicate.assets.map((asset) => asset.id), duplicateId: null } });
};

const processDuplicates = (duplicates: DuplicateResponseDto[]) => {
  return duplicates.filter((duplicate) => {
    if (duplicate.assets.length <= 1) {
      rectifyDuplicate(duplicate);
      return false;
    }
    return true;
  });
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
