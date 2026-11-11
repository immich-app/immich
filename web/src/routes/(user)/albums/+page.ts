import { getAllAlbumsQuery } from '#lib/queries/album.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await queryClient.query(getAllAlbumsQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('albums'),
    },
  };
}) satisfies PageLoad;
