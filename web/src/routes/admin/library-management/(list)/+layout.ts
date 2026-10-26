import { queryClient } from '#lib/queries/client.js';
import { getAllLibrariesQuery } from '#lib/queries/library.query.js';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
