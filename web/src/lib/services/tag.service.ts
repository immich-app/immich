import TagCreateModal from '#lib/modals/TagCreateModal.svelte';
import TagEditModal from '#lib/modals/TagEditModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { deleteTagMutation } from '#lib/queries/tag.query.ts';
import { Route } from '#lib/route.ts';
import type { TreeNode } from '#lib/utils/tree-utils.ts';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiPencil, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';

export const getTagActions = ($t: MessageFormatter, tag: TreeNode) => {
  const Create: ActionItem = {
    title: $t('create_tag'),
    icon: mdiPlus,
    onAction: () => modalManager.show(TagCreateModal, { baseTag: tag }),
  };

  const Update: ActionItem = {
    title: $t('edit_tag'),
    icon: mdiPencil,
    $if: () => tag.path.length > 0,
    onAction: () => modalManager.show(TagEditModal, { tag }),
  };

  const Delete: ActionItem = {
    title: $t('delete_tag'),
    icon: mdiTrashCanOutline,
    $if: () => tag.path.length > 0,
    onAction: async () => {
      const tagId = tag.id;
      if (!tagId) {
        return;
      }

      const confirmed = await modalManager.showDialog({
        title: $t('delete_tag'),
        prompt: $t('delete_tag_confirmation_prompt', { values: { tagName: tag.value } }),
        confirmText: $t('delete'),
      });

      if (!confirmed) {
        return;
      }

      await executeMutation(deleteTagMutation, [{ id: tagId }], {
        onSuccess: () => void goto(Route.tags({ path: tag.parent?.path ?? '' })),
      });
    },
  };

  return { Create, Update, Delete };
};
