<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { signUpAdmin } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput } from '@immich/ui';
  import { handleError } from '../../utils/handle-error';
  import { t } from 'svelte-i18n';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let name = $state('');

  let errorMessage: string = $state('');
  let canRegister = $state(false);

  $effect(() => {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      errorMessage = $t('password_does_not_match');
      canRegister = false;
    } else {
      errorMessage = '';
      canRegister = true;
    }
  });

  async function registerAdmin() {
    if (canRegister) {
      errorMessage = '';

      try {
        await signUpAdmin({ signUpDto: { email, password, name } });
        await retrieveServerConfig();
        await goto(AppRoute.AUTH_LOGIN);
      } catch (error) {
        handleError(error, $t('errors.unable_to_create_admin_account'));
        errorMessage = $t('errors.unable_to_create_admin_account');
      }
    }
  }

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await registerAdmin();
  };
</script>

<form {onsubmit} method="post" class="mt-5 flex flex-col gap-5 text-dark">
  <Field label={$t('admin_email')} required>
    <Input bind:value={email} type="email" autocomplete="email" />
  </Field>

  <Field label={$t('admin_password')} required>
    <PasswordInput bind:value={password} autocomplete="new-password" />
  </Field>

  <Field label={$t('confirm_admin_password')} required>
    <PasswordInput bind:value={confirmPassword} autocomplete="new-password" />
  </Field>

  <Field label={$t('name')} required>
    <Input bind:value={name} type="text" autocomplete="name" />
  </Field>

  {#if errorMessage}
    <Alert color="danger" title={errorMessage} />
  {/if}

  <div class="my-5 flex w-full">
    <Button type="submit" size="large" fullWidth>{$t('sign_up')}</Button>
  </div>
</form>
