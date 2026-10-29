import { UUID_REGEX } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getSharedLinkQuery } from '#lib/queries/shared-link.query.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
