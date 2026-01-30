import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getPlugins, getWorkflows } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const isReady = false;
  if (!isReady) {
    redirect(307, '/utilities');
  }

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
