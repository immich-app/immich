<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { signUpAdmin } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let name = $state('');
  let errorMessage = $state('');
  let valid = $derived(password === confirmPassword && confirmPassword.length > 0);

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  $effect(() => {
    errorMessage = password === confirmPassword || confirmPassword.length === 0 ? '' : $t('password_does_not_match');
  });

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    errorMessage = '';

    try {
      await signUpAdmin({ signUpDto: { email, password, name } });
      await retrieveServerConfig();
      await goto(AppRoute.AUTH_LOGIN);
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_admin_account'));
      errorMessage = $t('errors.unable_to_create_admin_account');
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <form onsubmit={onSubmit} method="post" class="flex flex-col gap-4">
    <Alert color="primary" class="mb-2">
      <Text>{$t('admin.registration_description')}</Text>
    </Alert>

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
      <Alert color="danger" title={errorMessage} size="medium" class="mt-4" />
    {/if}

    <Button class="mt-4" type="submit" size="giant" shape="round" fullWidth disabled={!valid}>{$t('sign_up')}</Button>
  </form>
</AuthPageLayout>
