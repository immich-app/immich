<script lang="ts">
  import { goto } from '$app/navigation';
  import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { logout } from '@immich/sdk';
  import type { PageData } from './$types';

  export let data: PageData;

  const onSuccess = async () => {
    await goto(AppRoute.AUTH_LOGIN);
    resetSavedUser();
    await logout();
  };
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    Hi {$user.name} ({$user.email}),
    <br />
    <br />
    This is either the first time you are signing into the system or a request has been made to change your password. Please
    enter the new password below.
  </p>

  <ChangePasswordForm user={$user} on:success={onSuccess} />
</FullscreenContainer>
