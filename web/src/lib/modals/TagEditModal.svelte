<script lang="ts">
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { updateTagMutation } from '#lib/queries/tag.query.ts';
  import { Route } from '#lib/route.ts';
  import type { TreeNode } from '#lib/utils/tree-utils.ts';
  import { FormModal, Text, toastManager } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';

  type Props = {
    tag: TreeNode;
    onClose: () => void;
  };

  const { tag, onClose }: Props = $props();

  let tagColor = $state(tag.color ?? '');
  let tagName = $state(tag.value ?? '');
  let tagPath = $state(tag.path ?? '');
  const tagPathDisplay = $state(tagPath.endsWith(tagName) ? tagPath.slice(0, -tagName.length) : tagPath);

  const onSubmit = async () => {
    if (!tag.id) {
      return;
    }

    await executeMutation(
      updateTagMutation,
      [{ id: tag.id, tagUpdateDto: { color: tagColor || null, name: tagName } }],
      {
        onSuccess: (updated) => {
          toastManager.primary($t('tag_updated', { values: { tag: updated.value } }));
          onClose();
          if (updated.value !== tag.path) {
            void goto(Route.tags({ path: updated.value }));
          }
        },
      },
    );
  };
</script>

<FormModal title={$t('edit_tag')} size="small" icon={mdiTag} {onClose} {onSubmit}>
  <SettingInputField inputType={SettingInputFieldType.COLOR} label={$t('color')} bind:value={tagColor} />
  <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('name')} bind:value={tagName} />
  {#if tagPathDisplay !== ''}
    <Text size="small">{$t('tag_full_path', { values: { tag: tagPathDisplay } })}{tagName}</Text>
  {/if}
</FormModal>
