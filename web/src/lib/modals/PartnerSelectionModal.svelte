<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { getPartners, PartnerDirection, searchUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, ListButton, LoadingSpinner, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
    onClose: (users?: UserResponseDto[]) => void;
  }

  let { user, onClose }: Props = $props();

  let availableUsers: UserResponseDto[] = $state([]);
  let selectedUsers: UserResponseDto[] = $state([]);

  const loadUsers = async () => {
    let users = await searchUsers();

    // remove current user
    users = users.filter((_user) => _user.id !== user.id);

    // exclude partners from the list of users available for selection
    const partners = await getPartners({ direction: PartnerDirection.SharedBy });
    const partnerIds = new Set(partners.map((partner) => partner.id));
    availableUsers = users.filter((user) => !partnerIds.has(user.id));
  };

  const selectUser = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.includes(user)
      ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
      : [...selectedUsers, user];
  };
</script>

<Modal title={$t('add_partner')} {onClose} size="small">
  <ModalBody>
    {#await loadUsers()}
      <div class="w-full flex place-items-center place-content-center">
        <LoadingSpinner />
      </div>
    {:then _}
      {#if availableUsers.length > 0}
        <div class="immich-scrollbar max-h-75 overflow-y-auto gap-2 flex flex-col">
          {#each availableUsers as user (user.id)}
            <ListButton onclick={() => selectUser(user)} selected={selectedUsers.includes(user)}>
              <UserAvatar {user} size="md" />
              <div class="text-start grow">
                <Text fontWeight="medium">{user.name}</Text>
                <Text size="tiny" color="muted">{user.email}</Text>
              </div>
            </ListButton>
          {/each}

          <ModalFooter>
            {#if selectedUsers.length > 0}
              <Button shape="round" fullWidth onclick={() => onClose(selectedUsers)}>{$t('add')}</Button>
            {/if}
          </ModalFooter>
        </div>
      {:else}
        <p class="py-5 text-sm">
          {$t('photo_shared_all_users')}
        </p>
      {/if}
    {/await}
  </ModalBody>
</Modal>
