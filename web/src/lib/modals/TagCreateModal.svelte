<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleCreateTag } from '$lib/services/tag.service';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { FormModal, Text } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    baseTag?: TreeNode;
  };

  const { onClose, baseTag }: Props = $props();

  let tagValue = $state(baseTag?.path ? `${baseTag.path}/` : '');
  let tagName = $state('');

  const onSubmit = async () => {
    const success = await handleCreateTag(tagValue + tagName);
    if (success) {
      onClose();
    }
  };
</script>

<FormModal size="small" title={$t('create_tag')} submitText={$t('create')} icon={mdiTag} {onClose} {onSubmit}>
  <Text size="small" class="mb-4">{$t('create_tag_description')}</Text>
  <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('tag')} bind:value={tagName} />
  {#if tagValue !== ''}
    <Text size="small">{$t('tag_full_path', { values: { tag: tagValue } })}{tagName}</Text>
  {/if}
</FormModal>
