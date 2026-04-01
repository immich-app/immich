import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getPlugins, getPluginTriggers, getWorkflow } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [plugins, workflow, triggers] = await Promise.all([
    getPlugins(),
    getWorkflow({ id: params.workflowId }),
    getPluginTriggers(),
  ]);
  const $t = await getFormatter();

  return {
    plugins,
    workflow,
    triggers,
    meta: {
      title: $t('edit_workflow'),
    },
  };
}) satisfies PageLoad;
