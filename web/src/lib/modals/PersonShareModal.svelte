<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import AddUsersModal from '$lib/modals/AddUsersModal.svelte';
  import {
    deleteSharedPersonUsers,
    getSharedPersonUsers,
    PersonUserRole,
    sharePeopleWithUser,
    type PersonResponseDto,
    type PersonShareResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import {
    ActionButton,
    Field,
    HStack,
    Modal,
    ModalBody,
    modalManager,
    Select,
    Text,
    type ActionItem,
  } from '@immich/ui';
  import { mdiPlus, mdiShareVariantOutline, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();

  const AddUsers: ActionItem = {
    title: 'Invite users',
    icon: mdiPlus,
    $if: () => !person.isShared,
    color: 'primary',
    onAction: () =>
      modalManager.show(AddUsersModal, {
        excludedUserIds: sharedWithUsers.map(({ sharedWithId }) => sharedWithId),
        onAddUsers: async (users) => {
          try {
            for (const user of users) {
              await sharePeopleWithUser({
                personShareRequestDto: { personIds: [person.id], sharedWithId: user.id, role: PersonUserRole.Read },
              });
            }
          } catch {
            return;
          }
          await loadSharedWith();
          return true;
        },
      }),
  };

  const getDeleteUserAction = (user: UserResponseDto) =>
    ({
      title: 'Delete user',
      icon: mdiTrashCanOutline,
      $if: () => !person.isShared,
      onAction: () =>
        deleteSharedPersonUsers({ personUserDeleteRequestDto: [{ personId: person.id, sharedWithId: user.id }] }),
    }) satisfies ActionItem;

  let sharedWithUsers = $state<PersonShareResponseDto>([]);

  const loadSharedWith = async () => {
    const sharedUsers = await getSharedPersonUsers();
    sharedWithUsers = sharedUsers.filter(({ personId }) => personId === person.id);
  };

  const handleRoleSelect = async (user: UserResponseDto, role: PersonUserRole) => {
    await sharePeopleWithUser({ personShareRequestDto: { personIds: [person.id], sharedWithId: user.id, role } });
  };
</script>

<Modal title="Share person" size="small" icon={mdiShareVariantOutline} {onClose}>
  <ModalBody>
    <HStack fullWidth class="mb-2 justify-between">
      <Text size="medium" fontWeight="semi-bold">{$t('users')}</Text>
      <HeaderActionButton action={AddUsers} />
    </HStack>
    <div class="ps-2">
      {#await loadSharedWith() then}
        {#each sharedWithUsers as { sharedWith, role } (sharedWith.id)}
          {@const DeleteUser = getDeleteUserAction(sharedWith)}
          <div class="flex items-center justify-between gap-4 py-2">
            <div class="flex items-center justify-between gap-4 w-full">
              <div class="flex flex-row items-center gap-2">
                <div>
                  <UserAvatar user={sharedWith} size="md" />
                </div>
                <Text size="small">{sharedWith.name}</Text>
              </div>
              <Field class="w-32">
                <Select
                  value={role}
                  options={[
                    { label: 'Read', value: PersonUserRole.Read },
                    { label: 'Write', value: PersonUserRole.Write },
                    { label: 'Admin', value: PersonUserRole.Admin },
                  ]}
                  onChange={(value) => handleRoleSelect(sharedWith, value)}
                />
              </Field>
            </div>
            <ActionButton type="icon" action={DeleteUser} />
          </div>
        {/each}
      {/await}
    </div>
  </ModalBody>
</Modal>
