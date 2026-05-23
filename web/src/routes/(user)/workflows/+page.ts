import { searchWorkflows } from '@immich/sdk';
import { pluginManager } from '$lib/managers/plugin-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const [workflows] = await Promise.all([searchWorkflows({}), pluginManager.ready()]);
  const $t = await getFormatter();

  return {
    workflows,
    meta: {
      title: $t('workflows'),
    },
  };
}) satisfies PageLoad;
