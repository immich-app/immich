import { getPartners, PartnerDirection } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const $t = await getFormatter();
  const partners = await getPartners({ direction: PartnerDirection.SharedWith });

  return {
    partners,
    meta: {
      title: $t('manage_geolocation'),
    },
  };
}) satisfies PageLoad;
