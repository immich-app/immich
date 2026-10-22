import { redirect } from '@sveltejs/kit';
import { pluginManager } from '$lib/managers/plugin-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { getWorkflowQuery } from '$lib/queries/workflow.query';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
