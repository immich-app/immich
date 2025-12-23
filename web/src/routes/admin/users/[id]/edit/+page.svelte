<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { handleUpdateUserAdmin } from '$lib/services/user-admin.service';
  import { user as authUser } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import {
    Button,
    Field,
    HStack,
    Input,
    Link,
    Modal,
    ModalBody,
    ModalFooter,
    NumberInput,
    Switch,
    Text,
  } from '@immich/ui';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const user = $state(data.user);
  let isAdmin = $state(user.isAdmin);
  let name = $state(user.name);
  let email = $state(user.email);
  let storageLabel = $state(user.storageLabel || '');
  const previousQuota = $state(user.quotaSizeInBytes);

  let quotaSize = $derived(
    typeof user.quotaSizeInBytes === 'number' ? convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB) : undefined,
  );

  const quotaSizeBytes = $derived(typeof quotaSize === 'number' ? convertToBytes(quotaSize, ByteUnit.GiB) : null);

  let quotaSizeWarning = $derived(
    previousQuota !== quotaSizeBytes &&
      !!quotaSizeBytes &&
      userInteraction.serverInfo &&
      quotaSizeBytes > userInteraction.serverInfo.diskSizeRaw,
  );

  const onClose = async () => {
    await goto(`${AppRoute.ADMIN_USERS}/${user.id}`);
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    const success = await handleUpdateUserAdmin(user, {
      email,
      name,
      storageLabel,
      quotaSizeInBytes: typeof quotaSize === 'number' ? convertToBytes(quotaSize, ByteUnit.GiB) : null,
      isAdmin,
    });

    if (success) {
      await onClose();
    }
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

      <Field label={$t('admin.quota_size_gib')} class="mt-4">
        <NumberInput bind:value={quotaSize} min="0" step="1" placeholder={$t('unlimited')} />
        {#if quotaSizeWarning}
          <Text size="small" color="danger">{$t('errors.quota_higher_than_disk_size')}</Text>
        {/if}
      </Field>

      <Field label={$t('storage_label')} class="mt-4">
        <Input bind:value={storageLabel} />
      </Field>

      <Text size="small" class="mt-2" color="muted">
        {$t('admin.note_apply_storage_label_previous_assets')}
        <Link href={AppRoute.ADMIN_QUEUES}>
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
