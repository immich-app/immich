<script lang="ts">
  import { goto } from '$app/navigation';
  import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { logout } from '@immich/sdk';
  import type { PageData } from './$types';
  import { t } from 'svelte-i18n';

  export let data: PageData;

  const onSuccess = async () => {
    await goto(AppRoute.AUTH_LOGIN);
    resetSavedUser();
    await logout();
  };
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    {$t('hi_user', { values: { name: $user.name, email: $user.email } })}
    <br />
    <br />
    {$t('change_password_description')}
  </p>

  <ChangePasswordForm {onSuccess} />
</FullscreenContainer>
