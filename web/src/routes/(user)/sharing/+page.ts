import { PartnerDirection, getPartners } from '@immich/sdk';
import { getAllAlbumsQuery } from '$lib/queries/album.query';
import { queryClient } from '$lib/queries/client';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
