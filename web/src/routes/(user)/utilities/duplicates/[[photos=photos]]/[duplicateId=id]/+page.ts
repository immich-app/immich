import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetDuplicates } from '@immich/sdk';
import { fail } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const duplicates = await getAssetDuplicates();
  const $t = await getFormatter();

  const activeDuplicate = duplicates.find((duplicate) => duplicate.duplicateId === params.duplicateId);

  if (!activeDuplicate) {
    return fail(404);
  }

  return {
    duplicates,
    activeDuplicate,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
