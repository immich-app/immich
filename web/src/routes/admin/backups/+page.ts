import { executeMutation, queryClient } from '#lib/queries/client.ts';
import { getAdminConfigQuery, updateAdminConfigMutation } from '#lib/queries/config-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const $t = await getFormatter();

  const config = await queryClient.query(getAdminConfigQuery());
  if (!config.backup.beta) {
    await executeMutation(() => ({ ...updateAdminConfigMutation(), meta: { error: { toast: false } } }), {
      backup: { ...config.backup, beta: true },
    });
  }

  return {
    meta: {
      title: $t('admin.backups'),
    },
  };
}) satisfies PageLoad;
