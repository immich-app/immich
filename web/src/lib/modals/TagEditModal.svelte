<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleUpdateTag } from '$lib/services/tag.service';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { FormModal, Text } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

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
    const success = await handleUpdateTag(tag, { color: tagColor, name: tagName });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('edit_tag')} size="small" icon={mdiTag} {onClose} {onSubmit}>
  <SettingInputField inputType={SettingInputFieldType.COLOR} label={$t('color')} bind:value={tagColor} />
  <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('name')} bind:value={tagName} />
  {#if tagPathDisplay !== ''}
    <Text size="small">{$t('tag_full_path', { values: { tag: tagPathDisplay } })}{tagName}</Text>
  {/if}
</FormModal>
