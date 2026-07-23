import { getPartners, getUser, PartnerDirection } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const [partner, sharedWith] = await Promise.all([
    getUser({ id: params.userId }),
    getPartners({ direction: PartnerDirection.SharedWith }),
  ]);
  const inTimeline = sharedWith.find((p) => p.id === params.userId)?.inTimeline ?? false;
  const $t = await getFormatter();

  return {
    partner,
    inTimeline,
    meta: {
      title: $t('partner'),
    },
  };
}) satisfies PageLoad;
