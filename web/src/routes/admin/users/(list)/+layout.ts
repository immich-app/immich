import { queryClient } from '#lib/queries/client.ts';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
