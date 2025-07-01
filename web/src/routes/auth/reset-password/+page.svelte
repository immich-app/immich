<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { user } from '$lib/stores/user.store';
  import { updateMyUser } from '@immich/sdk';
  import { Alert, Button, Field, HelperText, Input, Stack, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let email = $state('');
  let success = $state(false);
  let submitting = $state(false);
  let error429 = $state(false);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submitting = true;
    error429 = false;
    try {
      const response = await fetch( import.meta.env.VITE_API_URL + '/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'email': email }),
      });
      if (response.status === 429) {
        error429 = true;
        submitting = false;
        return;
      }
      if (!response.ok) {
        // Handle error (optional: show error to user)
        console.error('Failed to send reset email');
        submitting = false;
      } else {
        // Handle success (optional: show success to user)
        success = true;
      }
    } catch (error) {
      console.error('Error sending reset email', error);
      submitting = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <form onsubmit={onSubmit} class="flex flex-col gap-4">
    {#if !success}
    <Alert color="primary" size="small" class="mb-2">
      <Stack gap={4}>
        <Text>Use this page to reset your admin password. Only administrators of this PixelUnion instance are allowed to reset their password. If you are a non-admin user, please ask your administrator to reset the password for you.</Text>
      </Stack>
    </Alert>
    {/if}

    {#if success}
      <Alert color="success" size="small">
        <Stack gap={4}>
          <Text>If the email exists and belongs to an administrator, an email will have been sent. Click the link in the email to reset your password.</Text>
        </Stack>
      </Alert>
    {/if}

    {#if error429}
      <Alert color="danger" size="small" class="mb-2">
        <Stack gap={4}>
          <Text>Too many requests. Please wait a few minutes before trying again.</Text>
        </Stack>
      </Alert>
    {/if}

    {#if !success}
    <Field label={$t('admin_email')} required>
      <Input bind:value={email} type="email" autocomplete="email" />
    </Field>


    <Button class="mt-2" type="submit" size="large" shape="round" fullWidth disabled={submitting}>
      {submitting ? 'Sending...' : 'Request email to reset password'}
    </Button>
    {/if}
  </form>
</AuthPageLayout>
