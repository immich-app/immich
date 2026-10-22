<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { createPreloadedQuery, executeMutation } from '$lib/queries/client';
  import { getStorageQuery } from '$lib/queries/server.query';
  import { getUserAdminQuery, updateUserAdminMutation } from '$lib/queries/user-admin.query';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { Field, FormModal, Input, Link, NumberInput, Switch, Text } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const queries = {
    user: createPreloadedQuery(() => getUserAdminQuery(params.id)),
    storage: createQuery(getStorageQuery),
  };

  const user = $derived(queries.user.data);
  const serverInfo = $derived(queries.storage.data);
  let { isAdmin, name, email } = $derived(user);
  let storageLabel = $derived(user.storageLabel || '');
  const previousQuota = $derived(user.quotaSizeInBytes);

  let quotaSize = $derived(
    typeof user.quotaSizeInBytes === 'number' ? convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB) : undefined,
  );

  const quotaSizeBytes = $derived(typeof quotaSize === 'number' ? convertToBytes(quotaSize, ByteUnit.GiB) : null);

  let quotaSizeWarning = $derived(
    previousQuota !== quotaSizeBytes && !!quotaSizeBytes && serverInfo && quotaSizeBytes > serverInfo.diskSizeRaw,
  );

  const onClose = () => void goto(Route.viewUser(user));

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    await executeMutation(
      updateUserAdminMutation,
      [{ id: user.id, userAdminUpdateDto: { email, name, storageLabel, quotaSizeInBytes: quotaSizeBytes, isAdmin } }],
      { onSuccess: onClose },
    );
  };
</script>

<FormModal title={$t('edit_user')} size="small" icon={mdiAccountEditOutline} {onClose} {onSubmit}>
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
    <Link href={Route.queues()}>
      {$t('admin.storage_template_migration_job')}
    </Link>
  </Text>

  {#if user.id !== authManager.user.id}
    <Field label={$t('admin.admin_user')}>
      <Switch bind:checked={isAdmin} class="mt-4" />
    </Field>
  {/if}
</FormModal>
