<script lang="ts">
  import { handleStartTransfer } from '$lib/services/storage-target.service';
  import {
    searchUsersAdmin,
    StorageTransferScopeType,
    type StorageTargetResponseDto,
    type UserAdminResponseDto,
  } from '@immich/sdk';
  import { Field, FormModal, Select, Text } from '@immich/ui';
  import { mdiDownloadOutline, mdiUploadOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    target: StorageTargetResponseDto;
    direction: 'export' | 'import';
    onClose: () => void;
  };

  const { target, direction, onClose }: Props = $props();

  let users = $state<UserAdminResponseDto[]>([]);
  let ownerId = $state('');

  onMount(async () => {
    users = await searchUsersAdmin({ withDeleted: false });
    ownerId = users[0]?.id ?? '';
  });

  const userOptions = $derived(users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` })));

  const onSubmit = async () => {
    if (!ownerId) {
      return;
    }

    const success = await handleStartTransfer(target, direction, {
      ownerId,
      scope: { type: StorageTransferScopeType.All },
    });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={direction === 'export' ? $t('admin.storage_target_export') : $t('admin.storage_target_import')}
  icon={direction === 'export' ? mdiUploadOutline : mdiDownloadOutline}
  {onClose}
  {onSubmit}
  size="small"
  submitText={$t('start')}
>
  <div class="flex flex-col gap-4">
    <Text size="small">
      {direction === 'export'
        ? $t('admin.storage_target_export_description', { values: { name: target.name } })
        : $t('admin.storage_target_import_description', { values: { name: target.name } })}
    </Text>

    <Field label={$t('user')} required>
      <Select bind:value={ownerId} options={userOptions} />
    </Field>
  </div>
</FormModal>
