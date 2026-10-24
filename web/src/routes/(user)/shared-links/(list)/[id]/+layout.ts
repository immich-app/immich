import { redirect } from '@sveltejs/kit';
import { UUID_REGEX } from '$lib/constants';
import { queryClient } from '$lib/queries/client';
import { getSharedLinkQuery } from '$lib/queries/shared-link.query';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
