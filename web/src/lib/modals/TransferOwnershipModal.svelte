<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { searchUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, ListButton, LoadingSpinner, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    currentUserId: string;
    onClose: (user?: UserResponseDto) => void;
  }

  let { currentUserId, onClose }: Props = $props();

  let availableUsers: UserResponseDto[] = $state([]);
  let selectedUser: UserResponseDto | undefined = $state(undefined);

  const loadUsers = async () => {
    const users = await searchUsers({ allowTransfer: true });
    // Remove current user from the list
    availableUsers = users.filter((user) => user.id !== currentUserId);
  };

  const selectUser = (user: UserResponseDto) => {
    selectedUser = selectedUser?.id === user.id ? undefined : user;
  };
</script>

<Modal title={$t('transfer_ownership')} {onClose} size="small">
  <ModalBody>
    {#await loadUsers()}
      <div class="w-full flex place-items-center place-content-center">
        <LoadingSpinner />
      </div>
    {:then _}
      {#if availableUsers.length > 0}
        <p class="text-sm mb-4 text-gray-600 dark:text-gray-300">
          {$t('transfer_select_user')}
        </p>
        <div class="immich-scrollbar max-h-75 overflow-y-auto gap-2 flex flex-col">
          {#each availableUsers as user (user.id)}
            <ListButton onclick={() => selectUser(user)} selected={selectedUser?.id === user.id}>
              <UserAvatar {user} size="md" />
              <div class="text-start grow">
                <Text fontWeight="medium">{user.name}</Text>
                <Text size="tiny" color="muted">{user.email}</Text>
              </div>
            </ListButton>
          {/each}

          <ModalFooter>
            {#if selectedUser}
              <Button shape="round" fullWidth onclick={() => onClose(selectedUser)}>{$t('transfer_ownership')}</Button>
            {/if}
          </ModalFooter>
        </div>
      {:else}
        <p class="py-5 text-sm">
          {$t('transfer_no_eligible_users')}
        </p>
      {/if}
    {/await}
  </ModalBody>
</Modal>

