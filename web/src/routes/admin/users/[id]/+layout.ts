import { UUID_REGEX } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getUserAdminQuery } from '#lib/queries/user-admin.query.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
