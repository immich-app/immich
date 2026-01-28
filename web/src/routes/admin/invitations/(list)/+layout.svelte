<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { Route } from '$lib/route';
  import {
    getInvitationActions,
    getInvitationLink,
    getInvitationsActions,
  } from '$lib/services/invitation.service';
  import { listInvitations, type InvitationResponseDto } from '@immich/sdk';
  import {
    Badge,
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
    toastManager,
  } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let invitations: InvitationResponseDto[] = $state(data.invitations);

  const onInvitationCreate = async (invitation: InvitationResponseDto) => {
    invitations = await listInvitations();
  };

  const onInvitationRevoke = async ({ id }: { id: string }) => {
    invitations = invitations.filter((inv) => inv.id !== id);
  };

  const { Create } = $derived(getInvitationsActions($t));

  const onCopyLink = async (invitation: InvitationResponseDto) => {
    const link = getInvitationLink(invitation);
    await navigator.clipboard.writeText(link);
    toastManager.success($t('link_copied'));
  };

  const getActionsForInvitation = (invitation: InvitationResponseDto) => {
    return getInvitationActions($t, invitation, onCopyLink);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const classes = {
    column1: 'w-5/12 md:w-4/12',
    column2: 'w-3/12 md:w-3/12',
    column3: 'hidden md:block md:w-3/12',
    column4: 'w-4/12 md:w-2/12 flex justify-end',
  };
</script>

<OnEvents {onInvitationCreate} {onInvitationRevoke} />

<CommandPaletteDefaultProvider name={$t('invitations')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container center size="large">
    {#if invitations.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <p class="text-lg text-gray-500 dark:text-gray-400">{$t('no_invitations')}</p>
        <p class="mt-2 text-sm text-gray-400 dark:text-gray-500">{$t('no_invitations_description')}</p>
      </div>
    {:else}
      <Table class="mt-4" striped spacing="small" size="small">
        <TableHeader>
          <TableHeading class={classes.column1}>{$t('email')}</TableHeading>
          <TableHeading class={classes.column2}>{$t('status')}</TableHeading>
          <TableHeading class={classes.column3}>{$t('expires')}</TableHeading>
        </TableHeader>

        <TableBody>
          {#each invitations as invitation (invitation.id)}
            <TableRow color={invitation.acceptedAt ? 'success' : isExpired(invitation.expiresAt) ? 'danger' : undefined}>
              <TableCell class={classes.column1}>{invitation.email}</TableCell>
              <TableCell class={classes.column2}>
                {#if invitation.acceptedAt}
                  <Badge color="success">{$t('accepted')}</Badge>
                {:else if isExpired(invitation.expiresAt)}
                  <Badge color="danger">{$t('expired')}</Badge>
                {:else}
                  <Badge color="warning">{$t('pending')}</Badge>
                {/if}
              </TableCell>
              <TableCell class={classes.column3}>{formatDate(invitation.expiresAt)}</TableCell>
              <TableCell class={classes.column4}>
                {#if !invitation.acceptedAt && !isExpired(invitation.expiresAt)}
                  <ContextMenuButton color="primary" aria-label={$t('open')} items={getActionsForInvitation(invitation)} />
                {/if}
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}

    {@render children?.()}
  </Container>
</AdminPageLayout>
