<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { handleCreateUserAdmin } from '$lib/services/user-admin.service';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertToBytes } from '$lib/utils/byte-units';
  import { Field, FormModal, HelperText, Input, PasswordInput, Stack, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let success = $state(false);

  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let name = $state('');
  let shouldChangePassword = $state(true);
  let notify = $state(true);
  let isAdmin = $state(false);

  let quotaSize: string | undefined = $state();
  let isCreatingUser = $state(false);

  let quotaSizeInBytes = $derived(quotaSize === null ? null : convertToBytes(Number(quotaSize), ByteUnit.GiB));
  let quotaSizeWarning = $derived(
    quotaSizeInBytes && userInteraction.serverInfo && quotaSizeInBytes > userInteraction.serverInfo.diskSizeRaw,
  );

  const passwordMismatch = $derived(password !== passwordConfirm && passwordConfirm.length > 0);
  const passwordMismatchMessage = $derived(passwordMismatch ? $t('password_does_not_match') : '');
  const valid = $derived(!passwordMismatch && !isCreatingUser);

  const onClose = async () => {
    await goto(AppRoute.ADMIN_USERS);
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isCreatingUser = true;

    const user = await handleCreateUserAdmin({
      email,
      password,
      shouldChangePassword,
      name,
      quotaSizeInBytes,
      notify,
      isAdmin,
    });

    if (user) {
      await goto(`${AppRoute.ADMIN_USERS}/${user.id}`, { replaceState: true });
    }

    isCreatingUser = false;
  };
</script>

<FormModal title={$t('create_new_user')} size="small" disabled={!valid} submitText={$t('create')} {onClose} {onSubmit}>
  {#if success}
    <p class="text-sm text-immich-primary">{$t('new_user_created')}</p>
  {/if}

  <Stack gap={4}>
    <Field label={$t('email')} required>
      <Input bind:value={email} type="email" />
    </Field>

    {#if featureFlagsManager.value.email}
      <Field label={$t('admin.send_welcome_email')}>
        <Switch id="send-welcome-email" bind:checked={notify} class="text-sm" />
      </Field>
    {/if}

    <Field label={$t('password')} required={!featureFlagsManager.value.oauth}>
      <PasswordInput id="password" bind:value={password} autocomplete="new-password" />
    </Field>

    <Field label={$t('confirm_password')} required={!featureFlagsManager.value.oauth}>
      <PasswordInput id="confirmPassword" bind:value={passwordConfirm} autocomplete="new-password" />
      <HelperText color="danger">{passwordMismatchMessage}</HelperText>
    </Field>

    <Field label={$t('admin.require_password_change_on_login')}>
      <Switch id="require-password-change" bind:checked={shouldChangePassword} class="text-sm text-start" />
    </Field>

    <Field label={$t('name')} required>
      <Input bind:value={name} />
    </Field>

    <Field label={$t('admin.quota_size_gib')}>
      <Input bind:value={quotaSize} type="number" placeholder={$t('unlimited')} min="0" step="1" />
      {#if quotaSizeWarning}
        <HelperText color="danger">{$t('errors.quota_higher_than_disk_size')}</HelperText>
      {/if}
    </Field>

    <Field label={$t('admin.admin_user')}>
      <Switch bind:checked={isAdmin} />
    </Field>
  </Stack>
</FormModal>
