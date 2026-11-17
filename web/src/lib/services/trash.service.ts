import { executeMutation } from '#lib/queries/client.ts';
import { emptyTrashMutation, restoreTrashMutation } from '#lib/queries/trash.query.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { toastManager, type ActionItem } from '@immich/ui';
import { mdiDeleteForeverOutline, mdiHistory } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getTrashActions = ($t: MessageFormatter, assetCount: number) => {
  const RestoreAll: ActionItem = {
    title: $t('restore_all'),
    icon: mdiHistory,
    $if: () => assetCount > 0,
    onAction: () => handleRestoreTrash(),
  };

  const Empty: ActionItem = {
    title: $t('empty_trash'),
    icon: mdiDeleteForeverOutline,
    $if: () => assetCount > 0,
    onAction: () => handleEmptyTrash(),
  };

  return { RestoreAll, Empty };
};

const handleEmptyTrash = async () => {
  const $t = await getFormatter();

  await executeMutation(emptyTrashMutation, [], {
    confirm: { prompt: $t('empty_trash_confirmation') },
    onSuccess: ({ count }) => toastManager.primary($t('assets_permanently_deleted_count', { values: { count } })),
  });
};

const handleRestoreTrash = async () => {
  const $t = await getFormatter();

  await executeMutation(restoreTrashMutation, [], {
    confirm: { prompt: $t('assets_restore_confirmation') },
    onSuccess: ({ count }) => toastManager.primary($t('assets_restored_count', { values: { count } })),
  });
};
