import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates } from '@immich/sdk';
import { fail } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  // const asset = await getAssetInfoFromParam(params);
  const duplicates = await getAssetDuplicates();
  const $t = await getFormatter();

  // if (!asset) {
  //   return fail(404);
  // }

  const activeDuplicate = duplicates.find((duplicate) => duplicate.duplicateId === params.duplicateId);

  if (!activeDuplicate) {
    return fail(404);
  }

  return {
    // asset,
    duplicates,
    activeDuplicate,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
