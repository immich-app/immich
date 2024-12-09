<script lang="ts">
  import { goto } from '$app/navigation';
  import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { logout } from '@immich/sdk';
  import { Card, CardBody, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const onSuccess = async () => {
    await goto(AppRoute.AUTH_LOGIN);
    resetSavedUser();
    await logout();
  };
</script>

<FullscreenContainer title={data.meta.title}>
  <Card variant="subtle" color="secondary">
    <CardBody>
      <Text>
        {$t('hi_user', { values: { name: $user.name, email: $user.email } })}
        <br />
        <br />
        {$t('change_password_description')}
      </Text>
    </CardBody>
  </Card>

  <ChangePasswordForm {onSuccess} />
</FullscreenContainer>
