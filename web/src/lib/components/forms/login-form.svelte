<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { login } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onSuccess: () => unknown | Promise<unknown>;
    onFirstLogin: () => unknown | Promise<unknown>;
    onOnboarding: () => unknown | Promise<unknown>;
  }

  let { onSuccess, onFirstLogin, onOnboarding }: Props = $props();

  let errorMessage: string = $state('');
  let email = $state('');
  let password = $state('');
  let oauthError = $state('');
  let loading = $state(false);
  let oauthLoading = $state(true);

  onMount(async () => {
    if (!$featureFlags.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        await oauth.login(globalThis.location);
        await onSuccess();
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
      await onSuccess();
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

{#if !oauthLoading && $featureFlags.passwordLogin}
  <form {onsubmit} class="mt-5 flex flex-col gap-5 text-dark">
    {#if errorMessage}
      <Alert color="danger" title={errorMessage} />
    {/if}

    <Field label={$t('email')}>
      <Input name="email" type="email" autocomplete="email" bind:value={email} />
    </Field>

    <Field label={$t('password')}>
      <PasswordInput
        bind:value={password}
        autocomplete="current-password"
        showLabel={$t('show_password')}
        hideLabel={$t('hide_password')}
      />
    </Field>

    <Button type="submit" size="large" fullWidth {loading} class="mt-6">{$t('to_login')}</Button>
  </form>
{/if}

{#if $featureFlags.oauth}
  {#if $featureFlags.passwordLogin}
    <div class="inline-flex w-full items-center justify-center">
      <hr class="my-4 h-px w-3/4 border-0 bg-gray-200 dark:bg-gray-600" />
      <span
        class="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-immich-dark-gray dark:text-white"
      >
        {$t('or')}
      </span>
    </div>
  {/if}
  <div class="my-5 flex flex-col gap-5">
    {#if oauthError}
      <Alert color="danger" title={oauthError} />
    {/if}
    <Button
      loading={loading || oauthLoading}
      size="large"
      fullWidth
      color={$featureFlags.passwordLogin ? 'secondary' : 'primary'}
      onclick={handleOAuthLogin}
    >
      {$serverConfig.oauthButtonText}
    </Button>
  </div>
{/if}

{#if !$featureFlags.passwordLogin && !$featureFlags.oauth}
  <Alert color="warning" title={$t('login_has_been_disabled')} />
{/if}
