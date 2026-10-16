import { redirect } from '@sveltejs/kit';
import { UUID_REGEX } from '$lib/constants';
import { queryClient } from '$lib/queries/client';
import { getUserAdminQuery } from '$lib/queries/user-admin.query';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
