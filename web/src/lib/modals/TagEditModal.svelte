<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleUpdateTag } from '$lib/services/tag.service';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { FormModal } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    tag: TreeNode;
    onClose: () => void;
  };

  const { tag, onClose }: Props = $props();

  let tagColor = $state(tag.color ?? '');

  const onSubmit = async () => {
    const success = await handleUpdateTag(tag, { color: tagColor });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('edit_tag')} size="small" icon={mdiTag} {onClose} {onSubmit}>
  <SettingInputField inputType={SettingInputFieldType.COLOR} label={$t('color')} bind:value={tagColor} />
</FormModal>
