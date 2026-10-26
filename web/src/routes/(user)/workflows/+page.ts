import { pluginManager } from '#lib/managers/plugin-manager.svelte.js';
import { queryClient } from '#lib/queries/client.js';
import { searchWorkflowsQuery } from '#lib/queries/workflow.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
