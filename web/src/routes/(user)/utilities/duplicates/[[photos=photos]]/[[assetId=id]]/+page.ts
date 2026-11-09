import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
<<<<<<< HEAD
  const duplicates = await getAssetDuplicates();
=======
  await queryClient.query({ ...getAssetDuplicatesQuery(), staleTime: 0 });
>>>>>>> 8e7f4ea (fix(web): stale caches (#33131))
  const $t = await getFormatter();

  return {
    duplicates,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
