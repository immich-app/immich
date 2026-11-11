import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const duplicates = await getAssetDuplicates();
  const $t = await getFormatter();

  return {
    duplicates,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
