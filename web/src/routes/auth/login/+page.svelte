<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import LoginForm from '$lib/components/forms/login-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { resetSavedUser } from '$lib/stores/user.store';
  import { api } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;

  afterNavigate(async ({ from }) => {
    if (from?.url?.pathname === AppRoute.AUTH_CHANGE_PASSWORD) {
      resetSavedUser();
      await api.authenticationApi.logout();
    }
  });
</script>

{#if $featureFlags.loaded}
  <FullscreenContainer title={data.meta.title} showMessage={!!$serverConfig.loginPageMessage}>
    <p slot="message">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html $serverConfig.loginPageMessage}
    </p>

    <LoginForm
      on:success={() => goto(AppRoute.PHOTOS, { invalidateAll: true })}
      on:firstLogin={() => goto(AppRoute.AUTH_CHANGE_PASSWORD)}
      on:onboarding={() => goto(AppRoute.AUTH_ONBOARDING)}
    />
  </FullscreenContainer>
{/if}
