<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { user as authUser } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Modal, ModalBody, ModalFooter, Switch } from '@immich/ui';
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
      <div class="mb-4 flex flex-col gap-2">
        <label class="immich-form-label" for="email">{$t('email')}</label>
        <input class="immich-form-input" id="email" name="email" type="email" bind:value={email} />
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">{$t('name')}</label>
        <input class="immich-form-input" id="name" name="name" type="text" required bind:value={name} />
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="flex items-center gap-2 immich-form-label" for="quotaSize">
          {$t('admin.quota_size_gib')}
          {#if quotaSizeWarning}
            <p class="text-red-400 text-sm">{$t('errors.quota_higher_than_disk_size')}</p>
          {/if}</label
        >
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
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="storage-label">{$t('storage_label')}</label>
        <input
          class="immich-form-input"
          id="storage-label"
          name="storage-label"
          type="text"
          bind:value={storageLabel}
        />

        <p>
          {$t('admin.note_apply_storage_label_previous_assets')}
          <a href={AppRoute.ADMIN_JOBS} class="text-primary">
            {$t('admin.storage_template_migration_job')}
          </a>
        </p>
      </div>

      {#if user.id !== $authUser.id}
        <Field label={$t('admin.admin_user')}>
          <Switch bind:checked={isAdmin} />
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
