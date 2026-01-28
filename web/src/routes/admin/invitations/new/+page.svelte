<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Route } from '$lib/route';
  import { getInvitationLink, handleCreateInvitation } from '$lib/services/invitation.service';
  import { createInvitation, type InvitationResponseDto } from '@immich/sdk';
  import { Alert, Button, Container, Field, HStack, Input, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let email = $state('');
  let loading = $state(false);
  let createdInvitation: InvitationResponseDto | null = $state(null);
  let invitationLink = $state('');

  const valid = $derived(email.length > 0 && email.includes('@'));

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid || loading) {
      return;
    }

    loading = true;

    try {
      const invitation = await createInvitation({ createInvitationDto: { email } });
      createdInvitation = invitation;
      invitationLink = getInvitationLink(invitation);
      toastManager.success($t('invitation_created'));
    } catch (error) {
      toastManager.error($t('errors.unable_to_create_invitation'));
    } finally {
      loading = false;
    }
  };

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(invitationLink);
    toastManager.success($t('link_copied'));
  };

  const onCreateAnother = () => {
    email = '';
    createdInvitation = null;
    invitationLink = '';
  };
</script>

<AdminPageLayout breadcrumbs={[{ title: $t('invitations'), href: Route.invitations() }, { title: data.meta.title }]}>
  <Container center size="medium">
    {#if createdInvitation}
      <div class="mt-8 space-y-6">
        <Alert color="success">
          <Text>{$t('invitation_created_for', { values: { email: createdInvitation.email } })}</Text>
        </Alert>

        <Field label={$t('invitation_link')}>
          <div class="flex gap-2">
            <Input value={invitationLink} readonly class="flex-1" />
            <Button onclick={onCopyLink}>{$t('copy')}</Button>
          </div>
        </Field>

        <Alert color="primary">
          <Text>{$t('invitation_link_instructions')}</Text>
        </Alert>

        <HStack>
          <Button href={Route.invitations()} variant="outline">{$t('back_to_invitations')}</Button>
          <Button onclick={onCreateAnother}>{$t('create_another')}</Button>
        </HStack>
      </div>
    {:else}
      <form onsubmit={onSubmit} class="mt-8 space-y-6">
        <Alert color="primary">
          <Text>{$t('invitation_description')}</Text>
        </Alert>

        <Field label={$t('email')} required>
          <Input bind:value={email} type="email" autocomplete="email" placeholder={$t('enter_email_address')} />
        </Field>

        <HStack>
          <Button href={Route.invitations()} variant="outline">{$t('cancel')}</Button>
          <Button type="submit" disabled={!valid || loading} {loading}>{$t('send_invitation')}</Button>
        </HStack>
      </form>
    {/if}
  </Container>
</AdminPageLayout>
