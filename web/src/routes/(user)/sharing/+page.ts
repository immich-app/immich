import { getAllAlbumsQuery } from '#lib/queries/album.query.js';
import { queryClient } from '#lib/queries/client.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { PartnerDirection, getPartners } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await queryClient.query(getAllAlbumsQuery({ isShared: true }));
  const partners = await getPartners({ direction: PartnerDirection.SharedWith });
  const $t = await getFormatter();

  return {
    partners,
    meta: {
      title: $t('sharing'),
    },
  };
}) satisfies PageLoad;
