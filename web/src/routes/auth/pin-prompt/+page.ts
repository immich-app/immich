import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  await queryClient.query(getAuthStatusQuery());

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('pin_verification'),
    },
    continueUrl: Route.continue(url.searchParams.get('continue'), Route.locked()),
  };
}) satisfies PageLoad;
