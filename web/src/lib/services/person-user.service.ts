import {
  addUsersToPeople,
  getClusterGroupUsers,
  PersonUserRole,
  removeUsersFromPeople,
  type PersonResponseDto,
  type PersonUsersResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiCheck, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AddUsersModal from '$lib/modals/AddUsersModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getPersonUsersActions = (
  $t: MessageFormatter,
  person: PersonResponseDto,
  personUsers: PersonUsersResponseDto,
) => {
  const AddUsers: ActionItem = {
    title: $t('add_user'),
    icon: mdiPlus,
    color: 'primary',
    onAction: () =>
      modalManager.show(AddUsersModal, {
        emptyMessage: $t('person_share_no_users'),
        excludedUserIds: [authManager.user.id, ...personUsers.map(({ sharedWithId }) => sharedWithId)],
        loadUsers: () => getClusterGroupUsers({ id: authManager.user.clusterGroupId }),
        onAddUsers: (users: UserResponseDto[]) => handleSharePersonWithUsers(person, users),
      }),
  };

  return { AddUsers };
};

export const getPersonUserActions = ($t: MessageFormatter, person: PersonResponseDto, user: UserResponseDto) => {
  const Delete: ActionItem = {
    title: $t('delete_user'),
    icon: mdiTrashCanOutline,
    onAction: () => handleDeletePersonUser(person, user),
  };

  return { Delete };
};

export const handleSharePersonWithUsers = async (person: PersonResponseDto, users: UserResponseDto[]) => {
  const $t = await getFormatter();

  try {
    await addUsersToPeople({
      personUsersCreateDto: {
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
    await addUsersToPeople({
      personUsersCreateDto: { personIds: [personId], sharedWithIds: [userId], role },
    });
    eventManager.emit('PersonUserUpdate', { personId, userId, role });
    toastManager.primary({ icon: mdiCheck, title: $t('saved') });
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleDeletePersonUser = async (person: PersonResponseDto, user: UserResponseDto) => {
  const $t = await getFormatter();

  try {
    await removeUsersFromPeople({ personUsersDeleteDto: [{ personId: person.id, sharedWithId: user.id }] });
    eventManager.emit('PersonUserDelete', { personId: person.id, userId: user.id });
    toastManager.primary({ icon: mdiCheck, title: $t('saved') });
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};
