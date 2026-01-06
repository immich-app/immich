import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getPlugins, getWorkflows } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const [workflows, plugins] = await Promise.all([getWorkflows(), getPlugins()]);
  const $t = await getFormatter();

  return {
    workflows,
    plugins,
    meta: {
      title: $t('workflows'),
    },
  };
}) satisfies PageLoad;
