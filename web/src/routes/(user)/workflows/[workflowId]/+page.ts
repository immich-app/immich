import { pluginManager } from '#lib/managers/plugin-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getWorkflowQuery } from '#lib/queries/workflow.query.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
