<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { upsertTags, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (tag?: TagResponseDto) => void;
    baseTag?: TreeNode;
  };

  const { onClose, baseTag }: Props = $props();

  let tagValue = $state(baseTag?.value ? `${baseTag.value}/` : '');

  const createTag = async () => {
    const [tag] = await upsertTags({ tagUpsertDto: { tags: [tagValue] } });

    if (!tag) {
      return;
    }

    notificationController.show({
      message: $t('tag_created', { values: { tag: tag.value } }),
      type: NotificationType.Info,
    });

    onClose(tag);
  };
</script>

<Modal size="small" title={$t('create_tag')} icon={mdiTag} {onClose}>
  <ModalBody>
    <div class="text-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('create_tag_description')}
      </p>
    </div>

    <form onsubmit={createTag} autocomplete="off" id="create-tag-form">
      <div class="my-4 flex flex-col gap-2">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('tag')}
          bind:value={tagValue}
          required={true}
          autofocus={true}
        />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth shape="round" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" fullWidth shape="round" form="create-tag-form">{$t('create')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
