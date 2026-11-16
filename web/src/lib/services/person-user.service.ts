import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import AddUsersModal from '#lib/modals/AddUsersModal.svelte';
import PersonBulkShareModal from '#lib/modals/PersonBulkShareModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { removeUsersFromPeopleMutation, upsertPeopleUsersMutation } from '#lib/queries/person.query.ts';
import { PersonUserRole, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiAccountMultipleOutline, mdiClose, mdiPlus, mdiShareOutline } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';

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

const handleSharePersonWithUsers = async (person: PersonResponseDto, users: UserResponseDto[]) => {
  let shared = false;
  await executeMutation(
    upsertPeopleUsersMutation,
    [
      {
        peopleUsersUpsertDto: {
          personIds: [person.id],
          sharedWithIds: users.map(({ id }) => id),
          role: PersonUserRole.Admin,
        },
      },
    ],
    { onSuccess: () => (shared = true) },
  );
  return shared;
};

const handleDeletePersonUser = (person: PersonResponseDto, user: UserResponseDto) =>
  executeMutation(
    () => removeUsersFromPeopleMutation({ success: { toast: 'saved' } }),
    [{ personUsersDeleteDto: [{ personId: person.id, sharedWithId: user.id }] }],
  );
