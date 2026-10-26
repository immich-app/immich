import { queryClient } from '#lib/queries/client.js';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await queryClient.query(searchUsersAdminQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.user_management'),
    },
  };
}) satisfies LayoutLoad;
