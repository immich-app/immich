<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateGroupAdmin, type GroupAdminResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Stack } from '@immich/ui';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    group: GroupAdminResponseDto;
    onClose: (group?: GroupAdminResponseDto) => void;
  }

  let { group, onClose }: Props = $props();

  let name = $derived(group.name);
  let description = $derived(group.description ?? '');

  const handleEditGroup = async () => {
    try {
      const newGroup = await updateGroupAdmin({
        id: group.id,
        groupAdminUpdateDto: {
          name,
          description: description ?? null,
        },
      });
      onClose(newGroup);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_group'));
    }
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    await handleEditGroup();
  };
</script>

<Modal title={$t('edit_group')} size="small" icon={mdiAccountEditOutline} {onClose}>
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="edit-group-form">
      <Stack gap={4}>
        <Field label={$t('name')} required>
          <Input bind:value={name} />
        </Field>

        <Field label={$t('description')} required>
          <Input bind:value={description} />
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth form="edit-group-form" onclick={() => onClose()}
        >{$t('cancel')}</Button
      >
      <Button type="submit" shape="round" fullWidth form="edit-group-form">{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
