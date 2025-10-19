<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { user as authUser } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Label, Link, Modal, ModalBody, ModalFooter, Switch, Text } from '@immich/ui';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserAdminResponseDto;
    onClose: (data?: UserAdminResponseDto) => void;
  }

  let { user, onClose }: Props = $props();

  let isAdmin = $derived(user.isAdmin);
  let name = $derived(user.name);
  let email = $derived(user.email);
  let storageLabel = $derived(user.storageLabel || '');

  let quotaSize = $state(user.quotaSizeInBytes === null ? null : convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB));

  const previousQuota = user.quotaSizeInBytes;

  let quotaSizeWarning = $derived(
    previousQuota !== convertToBytes(Number(quotaSize), ByteUnit.GiB) &&
      !!quotaSize &&
      userInteraction.serverInfo &&
      convertToBytes(Number(quotaSize), ByteUnit.GiB) > userInteraction.serverInfo.diskSizeRaw,
  );

  const handleEditUser = async () => {
    try {
      const newUser = await updateUserAdmin({
        id: user.id,
        userAdminUpdateDto: {
          email,
          name,
          storageLabel,
          quotaSizeInBytes: quotaSize === null ? null : convertToBytes(Number(quotaSize), ByteUnit.GiB),
          isAdmin,
        },
      });

      onClose(newUser);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_user'));
    }
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    await handleEditUser();
  };
</script>

<Modal title={$t('edit_user')} size="small" icon={mdiAccountEditOutline} {onClose}>
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="edit-user-form">
      <Field label={$t('email')} required>
        <Input type="email" bind:value={email} />
      </Field>

      <Field label={$t('name')} required class="mt-4">
        <Input bind:value={name} />
      </Field>

      <div class="flex flex-col gap-1 mt-4">
        <Label class="flex items-center gap-2" for="quotaSize">{$t('admin.quota_size_gib')}</Label>
        <input
          class="immich-form-input"
          id="quotaSize"
          name="quotaSize"
          placeholder={$t('unlimited')}
          type="number"
          step="1"
          min="0"
          bind:value={quotaSize}
        />
        {#if quotaSizeWarning}
          <Text size="small" color="danger">{$t('errors.quota_higher_than_disk_size')}</Text>
        {/if}
      </div>

      <Field label={$t('storage_label')} class="mt-4">
        <Input bind:value={storageLabel} />
      </Field>

      <Text size="small" class="mt-2" color="muted">
        {$t('admin.note_apply_storage_label_previous_assets')}
        <Link href={AppRoute.ADMIN_JOBS}>
          {$t('admin.storage_template_migration_job')}
        </Link>
      </Text>

      {#if user.id !== $authUser.id}
        <Field label={$t('admin.admin_user')}>
          <Switch bind:checked={isAdmin} class="mt-4" />
        </Field>
      {/if}
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth form="edit-user-form" onclick={() => onClose()}
        >{$t('cancel')}</Button
      >
      <Button type="submit" shape="round" fullWidth form="edit-user-form">{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
