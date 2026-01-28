<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { Route } from '$lib/route';
  import { handleError } from '$lib/utils/handle-error';
  import { acceptInvitation } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let name = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  const passwordError = $derived(
    password === confirmPassword || confirmPassword.length === 0 ? '' : $t('password_does_not_match'),
  );
  const valid = $derived(
    name.length > 0 && password.length >= 8 && password === confirmPassword && confirmPassword.length > 0,
  );

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid || loading || data.error) {
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      await acceptInvitation({
        acceptInvitationDto: {
          token: data.token,
          name,
          password,
        },
      });
      await goto(Route.login());
    } catch (error) {
      handleError(error, $t('errors.unable_to_accept_invitation'));
      errorMessage = $t('errors.unable_to_accept_invitation');
    } finally {
      loading = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  {#if data.error === 'invalid'}
    <Alert color="danger" class="mb-4">
      <Text>{$t('invitation_invalid_description')}</Text>
    </Alert>
    <Button href={Route.login()} size="giant" shape="round" fullWidth>{$t('go_to_login')}</Button>
  {:else if data.error === 'already_accepted'}
    <Alert color="warning" class="mb-4">
      <Text>{$t('invitation_already_accepted_description')}</Text>
    </Alert>
    <Button href={Route.login()} size="giant" shape="round" fullWidth>{$t('go_to_login')}</Button>
  {:else if data.error === 'expired'}
    <Alert color="danger" class="mb-4">
      <Text>{$t('invitation_expired_description')}</Text>
    </Alert>
    <Button href={Route.login()} size="giant" shape="round" fullWidth>{$t('go_to_login')}</Button>
  {:else if data.invitation}
    <form onsubmit={onSubmit} method="post" class="flex flex-col gap-4">
      <Alert color="primary" class="mb-2">
        <Text>{$t('invitation_welcome', { values: { email: data.invitation.email } })}</Text>
      </Alert>

      <Field label={$t('name')} required>
        <Input bind:value={name} type="text" autocomplete="name" placeholder={$t('enter_your_name')} />
      </Field>

      <Field label={$t('password')} required>
        <PasswordInput bind:value={password} autocomplete="new-password" />
      </Field>

      <Field label={$t('confirm_password')} required>
        <PasswordInput bind:value={confirmPassword} autocomplete="new-password" />
      </Field>

      {#if passwordError}
        <Alert color="danger" title={passwordError} size="medium" />
      {/if}

      {#if errorMessage}
        <Alert color="danger" title={errorMessage} size="medium" class="mt-4" />
      {/if}

      <Button class="mt-4" type="submit" size="giant" shape="round" fullWidth disabled={!valid || loading} {loading}>
        {$t('create_account')}
      </Button>
    </form>
  {/if}
</AuthPageLayout>
