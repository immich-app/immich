<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { getSavedAccountById, updateSavedAccount } from '$lib/stores/saved-accounts.store';
  import { resetSavedUser } from '$lib/stores/user.store';
  import { oauth } from '$lib/utils';
  import { saveCurrentAccountFromLogin } from '$lib/utils/auth';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { login, type LoginResponseDto } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Stack, toastManager } from '@immich/ui';
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
  let reauthAccountEmail = $state('');

  const serverConfig = $derived(serverConfigManager.value);
  const isAddingAccount = $derived(data.addAccount);
  const isReauthenticating = $derived(!!data.reauthAccountId);

  const onSuccess = async (user: LoginResponseDto) => {
    // Show appropriate toast message based on flow
    if (isAddingAccount) {
      toastManager.success($t('account_added'));
    } else if (isReauthenticating) {
      toastManager.success($t('session_refreshed'));
    }

    resetSavedUser();

    await goto(data.continueUrl, { invalidateAll: true });
    eventManager.emit('AuthLogin', user);
  };

  const onFirstLogin = () => goto(AppRoute.AUTH_CHANGE_PASSWORD);
  const onOnboarding = () => goto(AppRoute.AUTH_ONBOARDING);

  onMount(async () => {
    if (data.reauthAccountId) {
      const account = await getSavedAccountById(data.reauthAccountId);
      if (account) {
        email = account.email;
        reauthAccountEmail = account.email;
      }
    }

    if (!featureFlagsManager.value.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        const user = await oauth.login(globalThis.location);

        // Save the account token immediately after successful OAuth login
        await saveCurrentAccountFromLogin(user);

        if (!user.isOnboarded) {
          await onOnboarding();
          return;
        }

        await onSuccess(user);
        return;
      } catch (error) {
        console.error('Error [login-form] [oauth.callback]', error);
        oauthError = getServerErrorMessage(error) || $t('errors.unable_to_complete_oauth_login');
        oauthLoading = false;
        return;
      }
    }

    try {
      if (
        (featureFlagsManager.value.oauthAutoLaunch && !oauth.isAutoLaunchDisabled(globalThis.location)) ||
        oauth.isAutoLaunchEnabled(globalThis.location)
      ) {
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

      // Save the account token immediately after successful login
      // This ensures the token is captured even for onboarding/password-change flows
      await saveCurrentAccountFromLogin(user);

      if (data.reauthAccountId) {
        await updateSavedAccount(data.reauthAccountId, {
          token: user.accessToken,
          isExpired: false,
        });
      }

      if (user.isAdmin && !serverConfig.isOnboarded) {
        await onOnboarding();
        return;
      }

      // change the user password before we onboard them
      if (!user.isAdmin && user.shouldChangePassword) {
        await onFirstLogin();
        return;
      }

      // We want to onboard after the first login since their password will change
      // and handleLogin will be called again (relogin). We then do onboarding on that next call.
      if (!user.isOnboarded) {
        await onOnboarding();
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

<AuthPageLayout title={data.meta.title}>
  <Stack gap={4}>
    {#if serverConfig.loginPageMessage}
      <Alert color="primary" class="mb-6">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html serverConfig.loginPageMessage}
      </Alert>
    {/if}

    {#if isAddingAccount}
      <Alert color="primary" class="mb-2">
        {$t('adding_new_account')}
      </Alert>
    {/if}

    {#if isReauthenticating && reauthAccountEmail}
      <Alert color="warning" class="mb-2">
        {$t('reauthenticate_account', { values: { email: reauthAccountEmail } })}
      </Alert>
    {/if}

    {#if !oauthLoading && featureFlagsManager.value.passwordLogin}
      <form {onsubmit} class="flex flex-col gap-4">
        {#if errorMessage}
          <Alert color="danger" title={errorMessage} closable />
        {/if}

        <Field label={$t('email')}>
          <Input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            bind:value={email}
            readonly={isReauthenticating && !!reauthAccountEmail}
          />
        </Field>

        <Field label={$t('password')}>
          <PasswordInput id="password" bind:value={password} autocomplete="current-password" />
        </Field>

        <Button type="submit" size="large" shape="round" fullWidth {loading} class="mt-6">{$t('to_login')}</Button>
      </form>
    {/if}

    {#if featureFlagsManager.value.oauth}
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
      {#if oauthError}
        <Alert color="danger" title={oauthError} closable />
      {/if}
      <Button
        shape="round"
        loading={loading || oauthLoading}
        disabled={loading || oauthLoading}
        size="large"
        fullWidth
        color={featureFlagsManager.value.passwordLogin ? 'secondary' : 'primary'}
        onclick={handleOAuthLogin}
      >
        {serverConfig.oauthButtonText}
      </Button>
    {/if}

    {#if !featureFlagsManager.value.passwordLogin && !featureFlagsManager.value.oauth}
      <Alert color="warning" title={$t('login_has_been_disabled')} />
    {/if}
  </Stack>
</AuthPageLayout>
