<script lang="ts">
  import { goto } from '$app/navigation';
  import LoginForm from '$lib/components/forms/login-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

{#if $featureFlags.loaded}
  <FullscreenContainer title={data.meta.title} showMessage={!!$serverConfig.loginPageMessage}>
    <p slot="message">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html $serverConfig.loginPageMessage}
    </p>

    <LoginForm
      onSuccess={() => goto(AppRoute.PHOTOS, { invalidateAll: true })}
      onFirstLogin={() => goto(AppRoute.AUTH_CHANGE_PASSWORD)}
      onOnboarding={() => goto(AppRoute.AUTH_ONBOARDING)}
    />
  </FullscreenContainer>
{/if}
