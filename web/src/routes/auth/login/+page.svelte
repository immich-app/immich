<script lang="ts">
  import { goto } from '$app/navigation';
  import LoginForm from '$lib/components/forms/login-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { loginPageMessage } from '$lib/constants';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<FullscreenContainer title={data.meta.title} showMessage={!!loginPageMessage}>
  <p slot="message">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html loginPageMessage}
  </p>

  <LoginForm
    authConfig={data.authConfig}
    on:success={() => goto(AppRoute.PHOTOS, { invalidateAll: true })}
    on:first-login={() => goto(AppRoute.AUTH_CHANGE_PASSWORD)}
  />
</FullscreenContainer>
