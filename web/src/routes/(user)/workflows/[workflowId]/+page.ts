import { pluginManager } from '#lib/managers/plugin-manager.svelte.js';
import { queryClient } from '#lib/queries/client.js';
import { getWorkflowQuery } from '#lib/queries/workflow.query.js';
import { Route } from '#lib/route.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  await Promise.all([
    queryClient.query(getWorkflowQuery(params.workflowId)).catch(() => redirect(307, Route.workflows())),
    pluginManager.ready(),
  ]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('edit_workflow'),
    },
  };
}) satisfies PageLoad;
