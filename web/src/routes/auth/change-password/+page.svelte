<script lang="ts">
  import { goto } from '$app/navigation';
  import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import type { PageData } from './$types';

  export let data: PageData;

  const onSuccessHandler = async () => {
    await fetch(AppRoute.AUTH_LOGOUT, { method: 'POST' });

    goto(AppRoute.AUTH_LOGIN);
  };
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    Salut {$user.name} ({$user.email}),
    <br />
    <br />
    Soit c'est la première fois que vous vous connectez au système, soit une demande de changement de mot de passe a été faite. 
    Veuillez entrer le nouveau mot de passe ci-dessous.
  </p>

  <ChangePasswordForm user={$user} on:success={onSuccessHandler} />
</FullscreenContainer>
