import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import { createInvitation, revokeInvitation, type InvitationResponseDto } from '@immich/sdk';
import { toastManager, type MenuItems } from '@immich/ui';
import { mdiContentCopy, mdiDeleteOutline, mdiPlusBoxOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getInvitationsActions = ($t: MessageFormatter) => ({
  Create: {
    title: $t('create_invitation'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(Route.newInvitation()),
  },
});

export const getInvitationActions = (
  $t: MessageFormatter,
  invitation: InvitationResponseDto,
  onCopyLink: (invitation: InvitationResponseDto) => void,
): MenuItems => [
  {
    title: $t('copy_link'),
    icon: mdiContentCopy,
    onAction: () => onCopyLink(invitation),
  },
  {
    title: $t('revoke'),
    icon: mdiDeleteOutline,
    onAction: () => handleRevokeInvitation($t, invitation.id),
  },
];

export const handleCreateInvitation = async ($t: MessageFormatter, email: string): Promise<boolean> => {
  try {
    const invitation = await createInvitation({ createInvitationDto: { email } });
    toastManager.success($t('invitation_created'));
    eventManager.emit('InvitationCreate', invitation);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_invitation'));
    return false;
  }
};

export const handleRevokeInvitation = async ($t: MessageFormatter, id: string): Promise<boolean> => {
  try {
    await revokeInvitation({ id });
    toastManager.success($t('invitation_revoked'));
    eventManager.emit('InvitationRevoke', { id });
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_revoke_invitation'));
    return false;
  }
};

export const getInvitationLink = (invitation: InvitationResponseDto): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${invitation.token}`;
};
