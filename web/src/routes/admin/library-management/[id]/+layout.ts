import { queryClient } from '#lib/queries/client.ts';
import { getLibraryQuery } from '#lib/queries/library.query.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
