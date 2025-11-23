<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { login, type LoginResponseDto, signUp } from '@immich/sdk';
  import { Alert, Button, Field, HelperText, Input, PasswordInput, Stack } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let activeTab: 'login' | 'signup' = $state('login');
  let errorMessage: string = $state('');
  let signupError: string = $state('');
  let email = $state('');
  let password = $state('');
  let signupEmail = $state('');
  let signupPassword = $state('');
  let signupPasswordConfirm = $state('');
  let signupName = $state('');
  let oauthError = $state('');
  let loading = $state(false);
  let oauthLoading = $state(true);
  let isCreatingUser = $state(false);

  const passwordMismatch = $derived(signupPassword !== signupPasswordConfirm && signupPasswordConfirm.length > 0);
  const passwordMismatchMessage = $derived(passwordMismatch ? $t('password_does_not_match') : '');
  const signupValid = $derived(!passwordMismatch && !isCreatingUser && signupEmail && signupPassword && signupName);

  const serverConfig = $derived(serverConfigManager.value);

  const onSuccess = async (user: LoginResponseDto) => {
    await goto(data.continueUrl, { invalidateAll: true });
    eventManager.emit('AuthLogin', user);
  };

  const onFirstLogin = () => goto(AppRoute.AUTH_CHANGE_PASSWORD);
  const onOnboarding = () => goto(AppRoute.AUTH_ONBOARDING);

  onMount(async () => {
    if (!featureFlagsManager.value.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        const user = await oauth.login(globalThis.location);

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

  const onSignupSubmit = async (event: Event) => {
    event.preventDefault();

    if (!signupValid) {
      return;
    }

    isCreatingUser = true;
    signupError = '';

    try {
      await signUp({
        signUpDto: {
          email: signupEmail,
          password: signupPassword,
          name: signupName,
        },
      });

      // Switch to login tab and pre-fill email
      activeTab = 'login';
      email = signupEmail;
      signupEmail = '';
      signupPassword = '';
      signupPasswordConfirm = '';
      signupName = '';
    } catch (error) {
      signupError = getServerErrorMessage(error) || $t('errors.unable_to_create_user');
    } finally {
      isCreatingUser = false;
    }
  };
</script>

<AuthPageLayout title="fotograph">
  <Stack gap={4}>
    {#if serverConfig.loginPageMessage}
      <Alert color="primary" class="mb-6">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html serverConfig.loginPageMessage}
      </Alert>
    {/if}

    {#if !oauthLoading && featureFlagsManager.value.passwordLogin}
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          type="button"
          onclick={() => (activeTab = 'login')}
          class="flex-1 py-3 px-4 text-center border-b-2 transition-colors {activeTab === 'login'
            ? 'border-immich-primary text-immich-primary font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
        >
          {$t('to_login')}
        </button>
        <button
          type="button"
          onclick={() => (activeTab = 'signup')}
          class="flex-1 py-3 px-4 text-center border-b-2 transition-colors {activeTab === 'signup'
            ? 'border-immich-primary text-immich-primary font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
        >
          {$t('sign_up')}
        </button>
      </div>

      <!-- Login Form -->
      {#if activeTab === 'login'}
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

          <Button type="submit" size="large" shape="round" fullWidth {loading} class="mt-6">
            {$t('to_login')}
          </Button>
        </form>
      {/if}

      <!-- Sign Up Form -->
      {#if activeTab === 'signup'}
        <form onsubmit={onSignupSubmit} class="flex flex-col gap-4">
          {#if signupError}
            <Alert color="danger" title={signupError} closable />
          {/if}

          <Field label={$t('email')} required>
            <Input bind:value={signupEmail} type="email" autocomplete="email" />
          </Field>

          <Field label={$t('name')} required>
            <Input bind:value={signupName} autocomplete="name" />
          </Field>

          <Field label={$t('password')} required>
            <PasswordInput id="signup-password" bind:value={signupPassword} autocomplete="new-password" />
          </Field>

          <Field label={$t('confirm_password')} required>
            <PasswordInput id="signup-confirmPassword" bind:value={signupPasswordConfirm} autocomplete="new-password" />
            <HelperText color="danger">{passwordMismatchMessage}</HelperText>
          </Field>

          <Button
            type="submit"
            size="large"
            shape="round"
            fullWidth
            loading={isCreatingUser}
            disabled={!signupValid}
            class="mt-6"
          >
            {$t('sign_up')}
          </Button>
        </form>
      {/if}
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
