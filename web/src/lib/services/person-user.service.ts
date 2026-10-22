import {
  PeopleUsersUpsertType,
  PersonUserRole,
  removeUsersFromPeople,
  upsertPeopleUsers,
  type PersonResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiAccountMultipleOutline, mdiCheck, mdiClose, mdiPlus, mdiShareOutline } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AddUsersModal from '$lib/modals/AddUsersModal.svelte';
import PersonBulkShareModal from '$lib/modals/PersonBulkShareModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getPeopleUserActions = ($t: MessageFormatter, users: UserResponseDto[], people?: PersonResponseDto[]) => {
  const ManageAccess: ActionItem = {
    title: $t('manage_person_access'),
    icon: mdiAccountMultipleOutline,
    $if: () => users.length > 0,
    onAction: () => modalManager.show(PersonBulkShareModal, { users, people }),
  };

  return { ManageAccess };
};

export const getPersonUsersActions = (
  $t: MessageFormatter,
  person: PersonResponseDto,
  sharedUsers: UserResponseDto[],
  clusterGroupUsers: UserResponseDto[],
) => {
  const excludedUserIds = [authManager.user.id, ...sharedUsers.map(({ id }) => id)];

  const AddUsers: ActionItem = {
    title: $t('add_user'),
    icon: mdiPlus,
    color: 'primary',
    $if: () => clusterGroupUsers.some(({ id }) => !excludedUserIds.includes(id)),
    onAction: () =>
      modalManager.show(AddUsersModal, {
        emptyMessage: $t('person_share_no_users'),
        excludedUserIds,
        loadUsers: () => Promise.resolve(clusterGroupUsers),
        onAddUsers: (users: UserResponseDto[]) => handleSharePersonWithUsers(person, users),
      }),
  };

  return { AddUsers };
};

export const getPersonUserActions = ($t: MessageFormatter, person: PersonResponseDto, user: UserResponseDto) => {
  const Delete: ActionItem = {
    title: $t('stop_sharing_person_with_user'),
    icon: mdiClose,
    onAction: () => handleDeletePersonUser(person, user),
  };

  const ShareBack: ActionItem = {
    title: $t('share_back'),
    icon: mdiShareOutline,
    color: 'primary',
    onAction: () => handleSharePersonWithUsers(person, [user]),
  };

  return { Delete, ShareBack };
};

export type BulkUpsertOptions = {
  sharedWithIds: string[];
  everyone?: boolean;
  personIds?: string[];
  removedIds?: string[];
};

export const handleBulkUpsert = async ({
  sharedWithIds,
  everyone = false,
  personIds = [],
  removedIds = [],
}: BulkUpsertOptions): Promise<boolean> => {
  const $t = await getFormatter();

  try {
    if (everyone) {
      await upsertPeopleUsers({
        peopleUsersUpsertDto: { type: PeopleUsersUpsertType.Everyone, sharedWithIds, role: PersonUserRole.Admin },
      });
    } else {
      if (personIds.length > 0) {
        await upsertPeopleUsers({ peopleUsersUpsertDto: { personIds, sharedWithIds, role: PersonUserRole.Admin } });
      }

      if (removedIds.length > 0) {
        await removeUsersFromPeople({
          personUsersDeleteDto: removedIds.flatMap((personId) =>
            sharedWithIds.map((sharedWithId) => ({ personId, sharedWithId })),
          ),
        });
      }
    }

    toastManager.primary({ icon: mdiCheck, title: $t('saved') });
    return true;
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
    return false;
  }
};

export const handleSharePersonWithUsers = async (person: PersonResponseDto, users: UserResponseDto[]) => {
  const $t = await getFormatter();

  try {
    await upsertPeopleUsers({
      peopleUsersUpsertDto: {
        personIds: [person.id],
        sharedWithIds: users.map(({ id }) => id),
        role: PersonUserRole.Admin,
      },
    });
    eventManager.emit('PersonShare', { personId: person.id });
    return true;
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
