import { queryClient } from '#lib/queries/client.ts';
import { searchLargeAssetsQuery } from '#lib/queries/search.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await queryClient.query({ ...searchLargeAssetsQuery(), staleTime: 0 });
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('large_files'),
    },
  };
}) satisfies PageLoad;
