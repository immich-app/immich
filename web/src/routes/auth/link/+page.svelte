<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { getServerErrorMessage } from '$lib/utils/handle-error';
  import { login } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Stack, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let linkToken = $state(data.linkToken);
  let email = $state(data.email || authManager.user?.email || '');
  let password = $state('');
  let errorMessage = $state('');
  let loading = $state(false);

  goto(Route.authLink(), { replaceState: true });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      errorMessage = '';
      loading = true;
      const user = await login({ loginCredentialDto: { email, password, linkToken } });
      eventManager.emit('AuthLogin', user);
      await authManager.refresh();
      toastManager.primary($t('linked_oauth_account'));
      await goto(Route.photos(), { invalidateAll: true });
    } catch (error) {
      errorMessage = getServerErrorMessage(error) || $t('errors.incorrect_email_or_password');
      loading = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <Stack gap={4}>
    {#if featureFlagsManager.value.passwordLogin}
      <Alert color="primary">
        {$t('oauth_link_existing_account')}
      </Alert>

      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        {#if errorMessage}
          <Alert color="danger" title={errorMessage} closable />
        {/if}

        <Field label={$t('email')}>
          <Input id="email" name="email" type="email" autocomplete="email" bind:value={email} />
        </Field>

        <Field label={$t('password')}>
          <PasswordInput id="password" bind:value={password} autocomplete="current-password" />
        </Field>

        <Button type="submit" size="large" shape="round" fullWidth {loading} class="mt-6">
          {$t('to_login')}
        </Button>
      </form>
    {:else}
      <Alert color="warning">
        {$t('oauth_link_password_login_required')}
      </Alert>
    {/if}
  </Stack>
</AuthPageLayout>
