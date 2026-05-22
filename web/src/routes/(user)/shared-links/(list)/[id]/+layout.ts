import { UUID_REGEX } from '$lib/constants';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllSharedLinks } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, Route.sharedLinks());
  }

  const [sharedLink] = await getAllSharedLinks({ id: params.id });
  if (!sharedLink) {
    redirect(307, Route.sharedLinks());
  }

  const $t = await getFormatter();

  return {
    sharedLink,
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies LayoutLoad;
