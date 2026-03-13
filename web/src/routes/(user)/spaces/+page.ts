import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllSpaces } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const spaces = await getAllSpaces();
  const $t = await getFormatter();

  return {
    spaces,
    meta: {
      title: $t('spaces'),
    },
  };
}) satisfies PageLoad;
