<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { login, type LoginResponseDto } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Stack } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let errorMessage: string = $state('');
  let email = $state('');
  let password = $state('');
  let oauthError = $state('');
  let loading = $state(false);
  let oauthLoading = $state(true);

  const onSuccess = async (user: LoginResponseDto) => {
    await goto(AppRoute.PHOTOS, { invalidateAll: true });
    eventManager.emit('auth.login', user);
  };

  const onFirstLogin = async () => await goto(AppRoute.AUTH_CHANGE_PASSWORD);
  const onOnboarding = async () => await goto(AppRoute.AUTH_ONBOARDING);

  onMount(async () => {
    if (!$featureFlags.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        const user = await oauth.login(globalThis.location);
        await onSuccess(user);
        return;
      } catch (error) {
        console.error('Error [login-form] [oauth.callback]', error);
        oauthError = getServerErrorMessage(error) || $t('errors.unable_to_complete_oauth_login');
        oauthLoading = false;
      }
    }

    try {
      if ($featureFlags.oauthAutoLaunch && !oauth.isAutoLaunchDisabled(globalThis.location)) {
        await goto(`${AppRoute.AUTH_LOGIN}?autoLaunch=0`, { replaceState: true });
        await oauth.authorize(globalThis.location);
        return;
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_connect'));
    }

    oauthLoading = false;
  });

  const handleLogin = async () => {
    try {
      errorMessage = '';
      loading = true;
      const user = await login({ loginCredentialDto: { email, password } });

      if (user.isAdmin && !$serverConfig.isOnboarded) {
        await onOnboarding();
        return;
      }

      if (!user.isAdmin && user.shouldChangePassword) {
        await onFirstLogin();
        return;
      }
      await onSuccess(user);
      return;
    } catch (error) {
      errorMessage = getServerErrorMessage(error) || $t('errors.incorrect_email_or_password');
      loading = false;
      return;
    }
  };

  const handleOAuthLogin = async () => {
    oauthLoading = true;
    oauthError = '';
    const success = await oauth.authorize(globalThis.location);
    if (!success) {
      oauthLoading = false;
      oauthError = $t('errors.unable_to_login_with_oauth');
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleLogin();
  };
</script>

{#if $featureFlags.loaded}
  <AuthPageLayout title={data.meta.title}>
    <Stack gap={4}>
      {#if $serverConfig.loginPageMessage}
        <Alert color="primary" class="mb-6">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html $serverConfig.loginPageMessage}
        </Alert>
      {/if}

      {#if !oauthLoading && $featureFlags.passwordLogin}
        <form {onsubmit} class="flex flex-col gap-4">
          {#if errorMessage}
            <Alert color="danger" title={errorMessage} closable />
          {/if}

          <Field label={$t('email')}>
            <Input id="email" name="email" type="email" autocomplete="email" bind:value={email} />
          </Field>

          <Field label={$t('password')}>
            <PasswordInput id="password" bind:value={password} autocomplete="current-password" />
          </Field>

          <Button type="submit" size="large" shape="round" fullWidth {loading} class="mt-6">{$t('to_login')}</Button>
        </form>
      {/if}

      {#if $featureFlags.oauth}
        {#if $featureFlags.passwordLogin}
          <div class="inline-flex w-full items-center justify-center my-4">
            <hr class="my-4 h-px w-3/4 border-0 bg-gray-200 dark:bg-gray-600" />
            <span
              class="absolute start-1/2 -translate-x-1/2 bg-gray-50 px-3 font-medium text-gray-900 dark:bg-neutral-900 dark:text-white"
            >
              {$t('or').toUpperCase()}
            </span>
          </div>
        {/if}
        {#if oauthError}
          <Alert color="danger" title={oauthError} closable />
        {/if}
        <Button
          shape="round"
          loading={loading || oauthLoading}
          disabled={loading || oauthLoading}
          size="large"
          fullWidth
          color={$featureFlags.passwordLogin ? 'secondary' : 'primary'}
          onclick={handleOAuthLogin}
        >
          {$serverConfig.oauthButtonText}
        </Button>
      {/if}

      {#if !$featureFlags.passwordLogin && !$featureFlags.oauth}
        <Alert color="warning" title={$t('login_has_been_disabled')} />
      {/if}
    </Stack>
  </AuthPageLayout>
{/if}
