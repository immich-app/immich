import { AppRoute, UUID_REGEX } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllSharedLinks } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, AppRoute.SHARED_LINKS);
  }

  const [sharedLink] = await getAllSharedLinks({ id: params.id });
  if (!sharedLink) {
    redirect(307, AppRoute.SHARED_LINKS);
  }

  const $t = await getFormatter();

  return {
    sharedLink,
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies LayoutLoad;
