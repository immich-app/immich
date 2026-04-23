<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { isHttpError, login, register, startOAuthReLink } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Stack, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let email = $state(data.email || authManager.user?.email || '');
  let password = $state('');
  let errorMessage = $state('');
  let loading = $state(false);
  let registering = $state(false);
  let reLinkMode = $state(!!data.reLinkToken);
  let reLinkLoading = $state(!!data.reLinkToken);
  let reLinkError = $state('');

  onMount(async () => {
    if (oauth.isCallback(globalThis.location)) {
      reLinkLoading = true;
      try {
        const user = await oauth.login(globalThis.location);
        eventManager.emit('AuthLogin', user);
        await authManager.refresh();
        toastManager.primary($t('linked_oauth_account'));
        await goto(Route.photos(), { invalidateAll: true });
      } catch (error) {
        reLinkLoading = false;
        reLinkMode = false;
        reLinkError =
          getServerErrorMessage(error) ||
          (isHttpError(error) ? error.message : undefined) ||
          $t('errors.unable_to_complete_oauth_login');
      }
      return;
    }

    if (data.reLinkToken) {
      try {
        await startOAuthReLink({ oAuthReLinkStartDto: { token: data.reLinkToken } });
        await oauth.authorize(globalThis.location);
      } catch (error) {
        reLinkLoading = false;
        reLinkMode = false;
        reLinkError = getServerErrorMessage(error) || $t('errors.invalid_oauth_relink_token');
      }
    }
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      errorMessage = '';
      loading = true;
      const user = await login({ loginCredentialDto: { email, password } });
      eventManager.emit('AuthLogin', user);
      await authManager.refresh();
      toastManager.primary($t('linked_oauth_account'));
      await goto(Route.photos(), { invalidateAll: true });
    } catch (error) {
      errorMessage = getServerErrorMessage(error) || $t('errors.incorrect_email_or_password');
      loading = false;
    }
  };

  const handleRegister = async () => {
    try {
      registering = true;
      const user = await register();
      eventManager.emit('AuthLogin', user);
      await authManager.refresh();
      await goto(Route.photos(), { invalidateAll: true });
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_user'));
      registering = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <Stack gap={4}>
    {#if reLinkError}
      <Alert color="danger" title={reLinkError} closable />
    {/if}

    {#if reLinkMode && reLinkLoading}
      <Alert color="primary">
        {$t('oauth_relink_in_progress')}
      </Alert>
    {:else}
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

      {#if featureFlagsManager.value.oauthAutoRegister}
        {#if featureFlagsManager.value.passwordLogin}
          <div class="inline-flex w-full items-center justify-center my-4">
            <hr class="my-4 h-px w-3/4 border-0 bg-gray-200 dark:bg-gray-600" />
            <span
              class="absolute start-1/2 -translate-x-1/2 bg-gray-50 px-3 font-medium text-gray-900 dark:bg-neutral-900 dark:text-white uppercase"
            >
              {$t('or')}
            </span>
          </div>
        {/if}

        <Button
          shape="round"
          size="large"
          fullWidth
          color={featureFlagsManager.value.passwordLogin ? 'secondary' : 'primary'}
          loading={registering}
          onclick={handleRegister}
        >
          {$t('create_new_account')}
        </Button>
      {/if}
    {/if}
  </Stack>
</AuthPageLayout>
