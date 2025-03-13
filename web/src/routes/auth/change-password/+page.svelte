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

  const onSubmit = async () => {
    if (!valid) {
      return;
    }

    await updateMyUser({ userUpdateMeDto: { password } });
    await goto(AppRoute.AUTH_LOGIN);
    resetSavedUser();
    await logout();
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <form onsubmit={onSubmit} class="flex flex-col gap-4">
    <Alert color="primary" size="small" class="mb-2">
      <Stack gap={4}>
        <Text>{$t('hi_user', { values: { name: $user.name, email: $user.email } })}</Text>
        <Text>{$t('change_password_description')}</Text>
      </Stack>
    </Alert>

    <Field label={$t('new_password')} required>
      <PasswordInput bind:value={password} autocomplete="new-password" />
    </Field>

    <Field label={$t('confirm_password')} required>
      <PasswordInput bind:value={passwordConfirm} autocomplete="new-password" />
      <HelperText color="danger">{errorMessage}</HelperText>
    </Field>

    <Button class="mt-2" type="submit" size="large" shape="round" fullWidth disabled={!valid}
      >{$t('to_change_password')}</Button
    >
  </form>
</AuthPageLayout>
