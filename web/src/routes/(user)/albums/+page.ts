import { getAllAlbumsQuery } from '$lib/queries/album.query';
import { queryClient } from '$lib/queries/client';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
