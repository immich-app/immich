import { queryClient } from '#lib/queries/client.js';
import { getAllSharedLinksQuery } from '#lib/queries/shared-link.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
