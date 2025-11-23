<script lang="ts">
  import { handleCreateUserAdmin } from '$lib/services/user-admin.service';
  import {
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
  } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  let { onClose }: Props = $props();

  let success = $state(false);

  let email = $state('');
  let password = $state('');
  let passwordConfirm = $state('');
  let name = $state('');
  let isCreatingUser = $state(false);

  const passwordMismatch = $derived(password !== passwordConfirm && passwordConfirm.length > 0);
  const passwordMismatchMessage = $derived(passwordMismatch ? $t('password_does_not_match') : '');
  const valid = $derived(!passwordMismatch && !isCreatingUser && email && password && name);

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isCreatingUser = true;

    const success = await handleCreateUserAdmin({
      email,
      password,
      shouldChangePassword: false,
      name,
      quotaSizeInBytes: null,
      notify: false,
      isAdmin: false,
    });

    if (success) {
      onClose();
    }

    isCreatingUser = false;
  };
</script>

<Modal title={$t('sign_up')} {onClose} size="small">
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="sign-up-form">
      {#if success}
        <p class="text-sm text-immich-primary">{$t('account_created_successfully')}</p>
      {/if}

      <Stack gap={4}>
        <Field label={$t('email')} required>
          <Input bind:value={email} type="email" />
        </Field>

        <Field label={$t('name')} required>
          <Input bind:value={name} />
        </Field>

        <Field label={$t('password')} required>
          <PasswordInput id="password" bind:value={password} autocomplete="new-password" />
        </Field>

        <Field label={$t('confirm_password')} required>
          <PasswordInput id="confirmPassword" bind:value={passwordConfirm} autocomplete="new-password" />
          <HelperText color="danger">{passwordMismatchMessage}</HelperText>
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth onclick={() => onClose()} shape="round">{$t('cancel')}</Button>
      <Button type="submit" disabled={!valid} fullWidth shape="round" form="sign-up-form">
        {$t('sign_up')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
