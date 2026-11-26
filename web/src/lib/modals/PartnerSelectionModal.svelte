<script lang="ts">
  import UserAvatar from '#lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { getPartnersQuery } from '#lib/queries/partner.query.ts';
  import { searchUsersQuery } from '#lib/queries/user.query.ts';
  import { PartnerDirection, type UserResponseDto } from '@immich/sdk';
  import { Button, ListButton, LoadingSpinner, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (users?: UserResponseDto[]) => void;
  }

  let { onClose }: Props = $props();

  let availableUsers: UserResponseDto[] = $state([]);
  let selectedUsers: UserResponseDto[] = $state([]);

  const loadUsers = async () => {
    const [users, partners] = await Promise.all([
      queryClient.query(searchUsersQuery()),
      queryClient.query(getPartnersQuery(PartnerDirection.SharedBy)),
    ]);
    const excludedIds = new Set([authManager.user.id, ...partners.map(({ id }) => id)]);
    availableUsers = users.filter(({ id }) => !excludedIds.has(id));
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
      <div class="flex w-full place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {:then _}
      {#if availableUsers.length > 0}
        <div class="flex max-h-75 immich-scrollbar flex-col gap-2 overflow-y-auto">
          {#each availableUsers as user (user.id)}
            <ListButton onclick={() => selectUser(user)} selected={selectedUsers.includes(user)}>
              <UserAvatar {user} size="md" />
              <div class="grow text-start">
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
