import { queryClient } from '#lib/queries/client.ts';
import { getAllSharedLinksQuery } from '#lib/queries/shared-link.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await queryClient.query(getAllSharedLinksQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies LayoutLoad;
