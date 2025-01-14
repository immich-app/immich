<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import PasswordField from '$lib/components/shared-components/password-field.svelte';
  import { AppRoute } from '$lib/constants';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { signUpAdmin } from '@immich/sdk';
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
  {#snippet message()}
    <p>
      {$t('admin.registration_description')}
    </p>
  {/snippet}

  <form onsubmit={onSubmit} method="post" class="mt-5 flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="email">{$t('admin_email')}</label>
      <input class="immich-form-input" id="email" bind:value={email} type="email" autocomplete="email" required />
    </div>

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="password">{$t('admin_password')}</label>
      <PasswordField id="password" bind:password autocomplete="new-password" />
    </div>

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="confirmPassword">{$t('confirm_admin_password')}</label>
      <PasswordField id="confirmPassword" bind:password={confirmPassword} autocomplete="new-password" />
    </div>

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="name">{$t('name')}</label>
      <input class="immich-form-input" id="name" bind:value={name} type="text" autocomplete="name" required />
    </div>

    {#if errorMessage}
      <p class="text-red-400">{errorMessage}</p>
    {/if}

    <div class="my-5 flex w-full">
      <Button type="submit" size="lg" fullwidth disabled={!valid}>{$t('sign_up')}</Button>
    </div>
  </form>
</AuthPageLayout>
