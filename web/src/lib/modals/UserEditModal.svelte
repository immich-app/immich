<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { handleUpdateUserAdmin } from '$lib/services/user-admin.service';
  import { user as authUser } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { type UserAdminResponseDto } from '@immich/sdk';
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

  interface Props {
    user: UserAdminResponseDto;
    onClose: () => void;
  }

  let { user, onClose }: Props = $props();

  let isAdmin = $derived(user.isAdmin);
  let name = $derived(user.name);
  let email = $derived(user.email);
  let storageLabel = $derived(user.storageLabel || '');

  const previousQuota = user.quotaSizeInBytes;

  let quotaSize = $state(
    typeof user.quotaSizeInBytes === 'number' ? convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB) : undefined,
  );

  const quotaSizeBytes = $derived(typeof quotaSize === 'number' ? convertToBytes(quotaSize, ByteUnit.GiB) : null);

  let quotaSizeWarning = $derived(
    previousQuota !== quotaSizeBytes &&
      !!quotaSizeBytes &&
      userInteraction.serverInfo &&
      quotaSizeBytes > userInteraction.serverInfo.diskSizeRaw,
  );

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
      onClose();
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
