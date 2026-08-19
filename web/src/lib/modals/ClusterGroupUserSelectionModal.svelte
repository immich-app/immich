<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { searchUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, ListButton, LoadingSpinner, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    excludedUserIds: string[];
    onClose: (users?: UserResponseDto[]) => void;
  };

  let { excludedUserIds, onClose }: Props = $props();

  let availableUsers: UserResponseDto[] = $state([]);
  let selectedUsers: UserResponseDto[] = $state([]);

  const loadUsers = async () => {
    const users = await searchUsers();
    const excluded = new Set(excludedUserIds);
    availableUsers = users.filter(({ id }) => !excluded.has(id));
  };

  const selectUser = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.some(({ id }) => id === user.id)
      ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
      : [...selectedUsers, user];
  };
</script>

<Modal title={$t('add_user')} {onClose} size="small">
  <ModalBody>
    {#await loadUsers()}
      <div class="flex w-full place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {:then _}
      {#if availableUsers.length > 0}
        <div class="flex max-h-75 immich-scrollbar flex-col gap-2 overflow-y-auto">
          {#each availableUsers as user (user.id)}
            <ListButton onclick={() => selectUser(user)} selected={selectedUsers.some(({ id }) => id === user.id)}>
              <UserAvatar {user} size="md" />
              <div class="grow text-start">
                <Text fontWeight="medium">{user.name}</Text>
                <Text size="tiny" color="muted">{user.email}</Text>
              </div>
            </ListButton>
          {/each}
        </div>

        <ModalFooter>
          <Button shape="round" fullWidth onclick={() => onClose(selectedUsers)} disabled={selectedUsers.length === 0}>
            {$t('add')}
          </Button>
        </ModalFooter>
      {:else}
        <Text color="muted">{$t('partner_page_no_more_users')}</Text>
      {/if}
    {/await}
  </ModalBody>
</Modal>
