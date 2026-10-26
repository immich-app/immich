import { pluginManager } from '#lib/managers/plugin-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { searchWorkflowsQuery } from '#lib/queries/workflow.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
