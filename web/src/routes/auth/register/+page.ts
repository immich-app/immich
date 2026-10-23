import { redirect } from '@sveltejs/kit';
import { readPreloadedQuery } from '$lib/queries/client';
import { getServerConfigQuery } from '$lib/queries/server.query';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await parent();
  if (readPreloadedQuery(getServerConfigQuery()).isInitialized) {
    // Admin has been registered, redirect to login
    redirect(307, Route.login());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.registration'),
    },
  };
}) satisfies PageLoad;
