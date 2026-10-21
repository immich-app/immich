import { pluginManager } from '$lib/managers/plugin-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { searchWorkflowsQuery } from '$lib/queries/workflow.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  await Promise.all([queryClient.query(searchWorkflowsQuery()), pluginManager.ready()]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('workflows'),
    },
  };
}) satisfies PageLoad;
