<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { createGroupAdmin, type GroupAdminResponseDto } from '@immich/sdk';
  import { Alert, Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Stack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (group?: GroupAdminResponseDto) => void;
  }

  let { onClose }: Props = $props();

  let error = $state('');
  let name = $state('');
  let description = $state('');
  let isPending = $state(false);

  let valid = $derived(name.length > 0);

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isPending = true;
    error = '';

    try {
      const group = await createGroupAdmin({ groupAdminCreateDto: { name, description } });
      onClose(group);
      return;
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_group'));
    } finally {
      isPending = false;
    }
  };
</script>

<Modal title={$t('create_new_group')} {onClose} size="small">
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="create-new-group-form">
      {#if error}
        <Alert color="danger" size="small" title={error} closable />
      {/if}

      <Stack gap={4}>
        <Field label={$t('name')} required>
          <Input bind:value={name} />
        </Field>

        <Field label={$t('description')}>
          <Input bind:value={description} />
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth onclick={() => onClose()} shape="round">{$t('cancel')}</Button>
      <Button type="submit" disabled={!valid} fullWidth shape="round" form="create-new-group-form"
        >{$t('create')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
