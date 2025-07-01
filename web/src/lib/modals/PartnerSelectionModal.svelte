<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { getPartners, PartnerDirection, searchUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
    onClose: (users?: UserResponseDto[]) => void;
  }

  let { user, onClose }: Props = $props();

  let availableUsers: UserResponseDto[] = $state([]);
  let selectedUsers: UserResponseDto[] = $state([]);

  onMount(async () => {
    let users = await searchUsers();

    // remove current user
    users = users.filter((_user) => _user.id !== user.id);

    // exclude partners from the list of users available for selection
    const partners = await getPartners({ direction: PartnerDirection.SharedBy });
    const partnerIds = new Set(partners.map((partner) => partner.id));
    availableUsers = users.filter((user) => !partnerIds.has(user.id));
  });

  const selectUser = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.includes(user)
      ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
      : [...selectedUsers, user];
  };
</script>

<Modal title={$t('add_partner')} {onClose} size="small">
  <ModalBody>
    <div class="immich-scrollbar max-h-[300px] overflow-y-auto">
      {#if availableUsers.length > 0}
        {#each availableUsers as user (user.id)}
          <button
            type="button"
            onclick={() => selectUser(user)}
            class="flex w-full place-items-center gap-4 px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
          >
            {#if selectedUsers.includes(user)}
              <span
                class="flex h-12 w-12 place-content-center place-items-center rounded-full border bg-immich-primary text-3xl text-white dark:border-immich-dark-gray dark:bg-immich-dark-primary dark:text-immich-dark-bg"
                >✓</span
              >
            {:else}
              <UserAvatar {user} size="lg" />
            {/if}

            <div class="text-start">
              <p class="text-immich-fg dark:text-immich-dark-fg">
                {user.name}
              </p>
              <p class="text-xs">
                {user.email}
              </p>
            </div>
          </button>
        {/each}
      {:else}
        <p class="py-5 text-sm">
          {$t('photo_shared_all_users')}
        </p>
      {/if}

      <ModalFooter>
        {#if selectedUsers.length > 0}
          <Button shape="round" fullWidth onclick={() => onClose(selectedUsers)}>{$t('add')}</Button>
        {/if}
      </ModalFooter>
    </div>
  </ModalBody>
</Modal>
