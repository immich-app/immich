import { queryClient } from '#lib/queries/client.ts';
import { getAssetDuplicatesQuery } from '#lib/queries/duplicate.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await queryClient.query({ ...getAssetDuplicatesQuery(), staleTime: 0 });
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
