import { queryClient } from '$lib/queries/client';
import { searchUsersAdminQuery } from '$lib/queries/user-admin.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
