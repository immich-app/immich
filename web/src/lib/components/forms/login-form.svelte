<script lang="ts">
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { AppRoute } from '$lib/constants';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { OAuthConfigResponseDto, api, oauth } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '../elements/buttons/button.svelte';

  let errorMessage: string;
  let email = '';
  let password = '';
  let oauthError: string;
  export let authConfig: OAuthConfigResponseDto;
  let loading = false;
  let oauthLoading = true;

  const dispatch = createEventDispatcher();

  onMount(async () => {
    if (oauth.isCallback(window.location)) {
      try {
        await oauth.login(window.location);
        dispatch('success');
        return;
      } catch (e) {
        console.error('Error [login-form] [oauth.callback]', e);
        oauthError = 'Unable to complete OAuth login';
      } finally {
        oauthLoading = false;
      }
    }

    try {
      const { data } = await oauth.getConfig(window.location);
      authConfig = data;

      const { enabled, url, autoLaunch } = authConfig;

      if (enabled && url && autoLaunch && !oauth.isAutoLaunchDisabled(window.location)) {
        await goto(`${AppRoute.AUTH_LOGIN}?autoLaunch=0`, { replaceState: true });
        await goto(url);
        return;
      }
    } catch (error) {
      authConfig.passwordLoginEnabled = true;
      handleError(error, 'Unable to connect!');
    }

    oauthLoading = false;
  });

  const login = async () => {
    try {
      errorMessage = '';
      loading = true;

      const { data } = await api.authenticationApi.login({
        loginCredentialDto: {
          email,
          password,
        },
      });

      if (!data.isAdmin && data.shouldChangePassword) {
        dispatch('first-login');
        return;
      }

      dispatch('success');
      return;
    } catch (error) {
      errorMessage = (await getServerErrorMessage(error)) || 'Incorrect email or password';
      loading = false;
      return;
    }
  };
</script>

{#if authConfig.passwordLoginEnabled}
  <form on:submit|preventDefault={login} class="mt-5 flex flex-col gap-5">
    {#if errorMessage}
      <p class="text-red-400" transition:fade>
        {errorMessage}
      </p>
    {/if}

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input
        class="immich-form-input"
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        bind:value={email}
        required
      />
    </div>

    <div class="flex flex-col gap-2">
      <label class="immich-form-label" for="password">Password</label>
      <input
        class="immich-form-input"
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        required
      />
    </div>

    <div class="my-5 flex w-full">
      <Button type="submit" size="lg" fullwidth disabled={loading || oauthLoading}>
        {#if loading}
          <span class="h-6">
            <LoadingSpinner />
          </span>
        {:else}
          Login
        {/if}
      </Button>
    </div>
  </form>
{/if}

{#if authConfig.enabled}
  {#if authConfig.passwordLoginEnabled}
    <div class="inline-flex w-full items-center justify-center">
      <hr class="my-4 h-px w-3/4 border-0 bg-gray-200 dark:bg-gray-600" />
      <span
        class="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-immich-dark-gray dark:text-white"
      >
        or
      </span>
    </div>
  {/if}
  <div class="my-5 flex flex-col gap-5">
    {#if oauthError}
      <p class="text-red-400" transition:fade>{oauthError}</p>
    {/if}
    <a href={authConfig.url} class="flex w-full">
      <Button
        type="button"
        disabled={loading || oauthLoading}
        size="lg"
        fullwidth
        color={authConfig.passwordLoginEnabled ? 'secondary' : 'primary'}
      >
        {#if oauthLoading}
          <span class="h-6">
            <LoadingSpinner />
          </span>
        {:else}
          {authConfig.buttonText || 'Login with OAuth'}
        {/if}
      </Button>
    </a>
  </div>
{/if}

{#if !authConfig.enabled && !authConfig.passwordLoginEnabled}
  <p class="p-4 text-center dark:text-immich-dark-fg">Login has been disabled.</p>
{/if}
