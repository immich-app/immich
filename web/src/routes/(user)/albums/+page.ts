import { getAllAlbumsQuery } from '#lib/queries/album.query.js';
import { queryClient } from '#lib/queries/client.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
