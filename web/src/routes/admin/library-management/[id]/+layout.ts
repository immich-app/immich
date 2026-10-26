import { queryClient } from '#lib/queries/client.js';
import { getLibraryQuery } from '#lib/queries/library.query.js';
import { Route } from '#lib/route.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params: { id }, url }) => {
  await authenticate(url, { admin: true });

  await queryClient.query(getLibraryQuery(id)).catch(() => redirect(307, Route.libraries()));

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.library_details'),
    },
  };
}) satisfies LayoutLoad;
