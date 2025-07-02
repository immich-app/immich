<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { user } from '$lib/stores/user.store';
  import { updateMyUser } from '@immich/sdk';
  import { Alert, Button, Field, HelperText, PasswordInput, Stack, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let success = $state(false);
  let submitting = $state(false);
  let error429 = $state(false);
  let errorReset = $state(false);

  let password = $state('');
  let passwordConfirm = $state('');
  const valid = $derived(password === passwordConfirm && passwordConfirm.length > 0);
  const errorMessage = $derived(passwordConfirm.length === 0 || valid ? '' : $t('password_does_not_match'));

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (!valid) {
      return;
    }
    submitting = true;
    error429 = false;
    errorReset = false;
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + '/api/auth/password-reset',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: data.token,
            timestamp: data.timestamp,
            password: password
          }),
        }
      );
      if (response.status === 429) {
        error429 = true;
        submitting = false;
        return;
      }
      if (!response.ok) {
        errorReset = true;
        submitting = false;
      } else {
        success = true;
      }
    } catch (error) {
      errorReset = true;
      submitting = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  {#if data.isValid}
    {#if success}
      <Alert color="success" size="small" class="mb-2">
        <Stack gap={4}>
          <Text>{$t('password_reset_success') || 'Your password has been reset successfully.'}</Text>
        </Stack>
      </Alert>
      <a href="/" class="text-primary underline">Go to homepage</a>
    {:else}
      <form onsubmit={onSubmit} class="flex flex-col gap-4">
        <Alert color="primary" size="small" class="mb-2">
          <Stack gap={4}>
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

        {#if error429}
          <Alert color="danger" size="small" class="mb-2">
            <Stack gap={4}>
              <Text>Too many requests. Please wait a few minutes before trying again.</Text>
            </Stack>
          </Alert>
        {/if}
        {#if errorReset}
          <Alert color="danger" size="small" class="mb-2">
            <Stack gap={4}>
              <Text>Failed to reset password. Please check your link or try again later.</Text>
            </Stack>
          </Alert>
        {/if}

        <Button class="mt-2" type="submit" size="large" shape="round" fullWidth disabled={!valid || submitting}
          >{$t('to_change_password')}</Button
        >
      </form>
    {/if}
  {:else}
    <Alert color="danger" size="small" class="mb-2">
      <Stack gap={4}>
        <Text>The password reset request is not valid or has expired. Please request a new password reset link.</Text>
      </Stack>
    </Alert>
  {/if}
</AuthPageLayout>
