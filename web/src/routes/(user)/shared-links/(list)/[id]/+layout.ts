import { UUID_REGEX } from '#lib/constants.js';
import { queryClient } from '#lib/queries/client.js';
import { getSharedLinkQuery } from '#lib/queries/shared-link.query.js';
import { Route } from '#lib/route.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, Route.sharedLinks());
  }

  await queryClient.query(getSharedLinkQuery(params.id)).catch(() => redirect(307, Route.sharedLinks()));

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies LayoutLoad;
