import { QueryParameter } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  const isTimelineOpened = url.searchParams.get(QueryParameter.IS_TIMELINE_OPENED) === 'true';
  return {
    asset,
    isTimelineOpened,
    meta: {
      title: $t('map'),
    },
  };
}) satisfies PageLoad;
