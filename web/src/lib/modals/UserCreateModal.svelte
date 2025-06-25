<script lang="ts">
  import { featureFlags } from '$lib/stores/server-config.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { createUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import {
    Alert,
    Button,
    Field,
    HelperText,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalFooter,
    PasswordInput,
    Stack,
    Switch,
  } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (user?: UserAdminResponseDto) => void;
  }

  let { onClose }: Props = $props();

  let error = $state('');
  let success = $state(false);

  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let name = $state('');
  let shouldChangePassword = $state(true);
  let notify = $state(true);

  let quotaSize: string | undefined = $state();
  let isCreatingUser = $state(false);

  let quotaSizeInBytes = $derived(quotaSize === null ? null : convertToBytes(Number(quotaSize), ByteUnit.GiB));
  let quotaSizeWarning = $derived(
    quotaSizeInBytes && userInteraction.serverInfo && quotaSizeInBytes > userInteraction.serverInfo.diskSizeRaw,
  );

  const passwordMismatch = $derived(password !== passwordConfirm && passwordConfirm.length > 0);
  const passwordMismatchMessage = $derived(passwordMismatch ? $t('password_does_not_match') : '');
  const valid = $derived(!passwordMismatch && !isCreatingUser);

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isCreatingUser = true;
    error = '';

    try {
      const user = await createUserAdmin({
        userAdminCreateDto: {
          email,
          password,
          shouldChangePassword,
          name,
          quotaSizeInBytes,
          notify,
        },
      });

      success = true;

      onClose(user);
      return;
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_user'));
    } finally {
      isCreatingUser = false;
    }
  };
</script>

<Modal title={$t('create_new_user')} {onClose} size="small">
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="create-new-user-form">
      {#if error}
        <Alert color="danger" size="small" title={error} closable />
      {/if}

      {#if success}
        <p class="text-sm text-immich-primary">{$t('new_user_created')}</p>
      {/if}

      <Stack gap={4}>
        <Field label={$t('email')} required>
          <Input bind:value={email} type="email" />
        </Field>

        {#if $featureFlags.email}
          <Field label={$t('admin.send_welcome_email')}>
            <Switch id="send-welcome-email" bind:checked={notify} class="text-sm" />
          </Field>
        {/if}

        <Field label={$t('password')} required={!$featureFlags.oauth}>
          <PasswordInput id="password" bind:value={password} autocomplete="new-password" />
        </Field>

        <Field label={$t('confirm_password')} required={!$featureFlags.oauth}>
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
          <Input bind:value={quotaSize} type="number" placeholder={$t('unlimited')} min="0" />
          {#if quotaSizeWarning}
            <HelperText color="danger">{$t('errors.quota_higher_than_disk_size')}</HelperText>
          {/if}
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth onclick={() => onClose()} shape="round">{$t('cancel')}</Button>
      <Button type="submit" disabled={!valid} fullWidth shape="round" form="create-new-user-form"
        >{$t('create')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
