<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import PasswordField from '$lib/components/shared-components/password-field.svelte';
  import { AppRoute } from '$lib/constants';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { logout, updateMyUser } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let password = $state('');
  let passwordConfirm = $state('');
  const valid = $derived(password === passwordConfirm && passwordConfirm.length > 0);
  const errorMessage = $derived(passwordConfirm.length === 0 || valid ? '' : $t('password_does_not_match'));

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    await updateMyUser({ userUpdateMeDto: { password: String(password) } });
    await goto(AppRoute.AUTH_LOGIN);
    resetSavedUser();
    await logout();
  };
</script>

<AuthPageLayout title={data.meta.title}>
  {#snippet message()}
    <p>
      {$t('hi_user', { values: { name: $user.name, email: $user.email } })}
      <br />
      <br />
      {$t('change_password_description')}
    </p>
  {/snippet}

  <form onsubmit={onSubmit} method="post" class="mt-5 flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="password">{$t('new_password')}</label>
      <PasswordField id="password" bind:password autocomplete="new-password" />
    </div>

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="confirmPassword">{$t('confirm_password')}</label>
      <PasswordField id="confirmPassword" bind:password={passwordConfirm} autocomplete="new-password" />
    </div>

    {#if errorMessage}
      <p class="text-sm text-red-400">{errorMessage}</p>
    {/if}

    <div class="my-5 flex w-full">
      <Button type="submit" size="lg" fullwidth disabled={!valid}>{$t('to_change_password')}</Button>
    </div>
  </form>
</AuthPageLayout>
