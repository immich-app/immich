<script lang="ts">
  import { handleCreatePairing } from '$lib/services/sync-node.service';
  import {
    getSyncNodeUsers,
    searchUsersAdmin,
    type SyncNodeRemoteUserDto,
    type SyncNodeResponseDto,
    type UserAdminResponseDto,
  } from '@immich/sdk';
  import { Field, FormModal, Input, Select, Switch, Text } from '@immich/ui';
  import { mdiAccountSyncOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    node: SyncNodeResponseDto;
    onClose: () => void;
  };

  const { node, onClose }: Props = $props();

  let localUsers = $state<UserAdminResponseDto[]>([]);
  let remoteUsers = $state<SyncNodeRemoteUserDto[]>([]);
  let localUserId = $state('');
  let remoteUserId = $state('');
  let remoteApiKey = $state('');
  let pushEnabled = $state(true);
  let pullEnabled = $state(true);
  let loadError = $state('');

  onMount(async () => {
    localUsers = await searchUsersAdmin({ withDeleted: false });
    localUserId = localUsers[0]?.id ?? '';

    try {
      remoteUsers = await getSyncNodeUsers({ id: node.id });
      remoteUserId = remoteUsers[0]?.id ?? '';
    } catch {
      // Listing the peer's users needs the peer to be reachable right now, which
      // is a different failure from the pairing itself being invalid.
      loadError = $t('admin.sync_pairing_users_unavailable');
    }
  });

  const localOptions = $derived(localUsers.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` })));
  const remoteOptions = $derived(
    remoteUsers.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` })),
  );

  const onSubmit = async () => {
    if (!localUserId || !remoteUserId || !remoteApiKey) {
      return;
    }

    const success = await handleCreatePairing(node, {
      localUserId,
      remoteUserId,
      remoteApiKey,
      pushEnabled,
      pullEnabled,
    });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={$t('admin.sync_pairing_add')}
  icon={mdiAccountSyncOutline}
  {onClose}
  {onSubmit}
  size="medium"
  submitText={$t('add')}
>
  <div class="flex flex-col gap-4">
    <Text size="small" color="secondary">
      {$t('admin.sync_pairing_add_description', { values: { name: node.name } })}
    </Text>

    {#if loadError}
      <Text size="small" color="danger">{loadError}</Text>
    {/if}

    <Field label={$t('admin.sync_pairing_local_user')} required>
      <Select bind:value={localUserId} options={localOptions} />
    </Field>

    <Field label={$t('admin.sync_pairing_remote_user')} required>
      <Select bind:value={remoteUserId} options={remoteOptions} />
    </Field>

    <Field label={$t('admin.sync_pairing_api_key')} description={$t('admin.sync_pairing_api_key_description')} required>
      <Input type="password" bind:value={remoteApiKey} autocomplete="new-password" />
    </Field>

    <Field label={$t('admin.sync_pairing_push')} description={$t('admin.sync_pairing_push_description')}>
      <Switch bind:checked={pushEnabled} />
    </Field>

    <Field label={$t('admin.sync_pairing_pull')} description={$t('admin.sync_pairing_pull_description')}>
      <Switch bind:checked={pullEnabled} />
    </Field>
  </div>
</FormModal>
