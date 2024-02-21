<script lang="ts">
  import { goto } from '$app/navigation';
  import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    Hi {$user.name} ({$user.email}),
    <br />
    <br />
    This is either the first time you are signing into the system or a request has been made to change your password. Please
    enter the new password below.
  </p>

  <ChangePasswordForm user={$user} on:success={() => goto(AppRoute.AUTH_LOGIN)} />
</FullscreenContainer>
