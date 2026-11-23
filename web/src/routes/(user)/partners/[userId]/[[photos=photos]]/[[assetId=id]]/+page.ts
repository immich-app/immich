import { queryClient } from '#lib/queries/client.ts';
import { getUserQuery } from '#lib/queries/user.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  await queryClient.query(getUserQuery(params.userId));
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('partner'),
    },
  };
}) satisfies PageLoad;
