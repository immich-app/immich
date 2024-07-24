import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getUser } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const partner = await getUser({ id: params.userId });
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  return {
    asset,
    partner,
    meta: {
      title: $t('partner'),
    },
  };
}) satisfies PageLoad;
