<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { logout, updateMyUser } from '@immich/sdk';
  import { Alert, Button, Field, HelperText, PasswordInput, Stack, Text } from '@immich/ui';
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
  <div class="m-4">
    <Alert color="primary" size="small">
      <Stack gap={4}>
        <Text>{$t('hi_user', { values: { name: $user.name, email: $user.email } })}</Text>
        <Text>{$t('change_password_description')}</Text>
      </Stack>
    </Alert>
  </div>

  <form onsubmit={onSubmit} method="post" class="mx-4 mt-6">
    <Stack gap={4} class="mt-4">
      <Field label={$t('new_password')} required>
        <PasswordInput bind:value={password} autocomplete="new-password" />
      </Field>

      <Field label={$t('confirm_password')} required>
        <PasswordInput bind:value={passwordConfirm} autocomplete="new-password" />
        {#if errorMessage}
          <HelperText color="danger">{errorMessage}</HelperText>
        {/if}
      </Field>

      <div class="my-5 flex w-full">
        <Button type="submit" size="large" shape="round" fullWidth disabled={!valid}>{$t('to_change_password')}</Button>
      </div>
    </Stack>
  </form>
</AuthPageLayout>
