<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { updateTag, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    tag: TreeNode;
    onClose: (updatedTag?: TagResponseDto) => void;
  };

  const { tag, onClose }: Props = $props();

  let tagColor = $state(tag.color ?? '');

  const handleEdit = async () => {
    if (!tag.id) {
      return;
    }

    const updatedTag = await updateTag({ id: tag.id, tagUpdateDto: { color: tagColor } });

    notificationController.show({
      message: $t('tag_updated', { values: { tag: tag.value } }),
      type: NotificationType.Info,
    });

    onClose(updatedTag);
  };
</script>

<Modal title={$t('edit_tag')} icon={mdiTag} {onClose}>
  <ModalBody>
    <form onsubmit={handleEdit} autocomplete="off" id="edit-tag-form">
      <div class="my-4 flex flex-col gap-2">
        <SettingInputField inputType={SettingInputFieldType.COLOR} label={$t('color')} bind:value={tagColor} />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth shape="round" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" fullWidth shape="round" form="edit-tag-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
