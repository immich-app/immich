import { QueryParameter } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAllTagsQuery } from '#lib/queries/tag.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const $t = await getFormatter();

  await queryClient.query(getAllTagsQuery());

  return {
    path: url.searchParams.get(QueryParameter.PATH) ?? '',
    meta: {
      title: $t('tags'),
    },
  };
}) satisfies PageLoad;
