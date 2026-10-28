import { queryClient } from '#lib/queries/client.ts';
import { getAllLibrariesQuery } from '#lib/queries/library.query.ts';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await Promise.all([queryClient.query(getAllLibrariesQuery()), queryClient.query(searchUsersAdminQuery())]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('external_libraries'),
    },
  };
}) satisfies LayoutLoad;
