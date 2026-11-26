import { getAllAlbumsQuery } from '#lib/queries/album.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getPartnersQuery } from '#lib/queries/partner.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { PartnerDirection } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const [$t] = await Promise.all([
    getFormatter(),
    queryClient.query({ ...getAllAlbumsQuery({ isShared: true }), staleTime: 0 }),
    queryClient.query(getPartnersQuery(PartnerDirection.SharedWith)),
  ]);

  return {
    meta: {
      title: $t('sharing'),
    },
  };
}) satisfies PageLoad;
