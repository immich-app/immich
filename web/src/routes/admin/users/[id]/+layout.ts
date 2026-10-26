import { UUID_REGEX } from '#lib/constants.js';
import { queryClient } from '#lib/queries/client.js';
import { getUserAdminQuery } from '#lib/queries/user-admin.query.js';
import { Route } from '#lib/route.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, Route.users());
  }

  await queryClient.query(getUserAdminQuery(params.id)).catch(() => redirect(307, Route.users()));

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.user_details'),
    },
  };
}) satisfies LayoutLoad;
