import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { PartnerDirection, getAllAlbums, getPartners } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const sharedAlbums = await getAllAlbums({ shared: true });
  const partners = await getPartners({ direction: PartnerDirection.SharedWith });
  const $t = await getFormatter();

  return {
    sharedAlbums,
    partners,
    meta: {
      title: $t('sharing'),
    },
  };
}) satisfies PageLoad;
