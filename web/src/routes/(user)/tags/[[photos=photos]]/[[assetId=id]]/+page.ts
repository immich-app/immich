import { QueryParameter } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllTags } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const $t = await getFormatter();

  const tags = await getAllTags();

  return {
    path: url.searchParams.get(QueryParameter.PATH) ?? '',
    tags,
    meta: {
      title: $t('tags'),
    },
  };
}) satisfies PageLoad;
