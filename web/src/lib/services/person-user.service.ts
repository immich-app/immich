import {
  deleteSharedPersonUsers,
  getSharedPersonUsers,
  PersonUserRole,
  sharePeopleWithUser,
  type PersonResponseDto,
  type PersonShareResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AddUsersModal from '$lib/modals/AddUsersModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getPersonUsersActions = (
  $t: MessageFormatter,
  person: PersonResponseDto,
  personUsers: PersonShareResponseDto,
) => {
  const AddUsers: ActionItem = {
    title: $t('invite_people'),
    icon: mdiPlus,
    color: 'primary',
    $if: () => !person.isShared,
    onAction: () =>
      modalManager.show(AddUsersModal, {
        excludedUserIds: [authManager.user.id, ...personUsers.map(({ sharedWithId }) => sharedWithId)],
        onAddUsers: (users: UserResponseDto[]) => handleSharePersonWithUsers(person, users),
      }),
  };

  return { AddUsers };
};

export const getPersonUserActions = ($t: MessageFormatter, person: PersonResponseDto, user: UserResponseDto) => {
  const Delete: ActionItem = {
    title: $t('delete_user'),
    icon: mdiTrashCanOutline,
    $if: () => !person.isShared,
    onAction: () => handleDeletePersonUser(person, user),
  };

  return { Delete };
};

export const getPersonUsers = async (person: { id: string }) => {
  const $t = await getFormatter();

  try {
    const personUsers = await getSharedPersonUsers();
    return personUsers.filter(({ personId }) => personId === person.id);
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
    return [];
  }
};

export const handleSharePersonWithUsers = async (person: PersonResponseDto, users: UserResponseDto[]) => {
  const $t = await getFormatter();

  try {
    await sharePeopleWithUser({
      personShareRequestDto: {
        personIds: [person.id],
        sharedWithIds: users.map(({ id }) => id),
        role: PersonUserRole.Read,
      },
    });
    eventManager.emit('PersonShare', { personId: person.id });
    return true;
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleUpdatePersonUserRole = async ({
  personId,
  userId,
  role,
}: {
  personId: string;
  userId: string;
  role: PersonUserRole;
}) => {
  const $t = await getFormatter();

  try {
    await sharePeopleWithUser({
      personShareRequestDto: { personIds: [personId], sharedWithIds: [userId], role },
    });
    eventManager.emit('PersonUserUpdate', { personId, userId, role });
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleDeletePersonUser = async (person: PersonResponseDto, user: UserResponseDto) => {
  const $t = await getFormatter();

  try {
    await deleteSharedPersonUsers({ personUserDeleteRequestDto: [{ personId: person.id, sharedWithId: user.id }] });
    eventManager.emit('PersonUserDelete', { personId: person.id, userId: user.id });
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};
