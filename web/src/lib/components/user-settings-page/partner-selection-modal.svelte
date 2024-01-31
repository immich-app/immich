<script lang="ts">
  import { api, type UserResponseDto } from '@api';
  import BaseModal from '../shared-components/base-modal.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { createEventDispatcher, onMount } from 'svelte';

  export let user: UserResponseDto;

  let availableUsers: UserResponseDto[] = [];
  let selectedUsers: UserResponseDto[] = [];

  const dispatch = createEventDispatcher<{ close: void; 'add-users': UserResponseDto[] }>();

  onMount(async () => {
    // TODO: update endpoint to have a query param for deleted users
    let { data: users } = await api.userApi.getAllUsers({ isAll: false });

    // remove invalid users
    users = users.filter((_user) => !(_user.deletedAt || _user.id === user.id));

    // exclude partners from the list of users available for selection
    const { data: partners } = await api.partnerApi.getPartners({ direction: 'shared-by' });
    const partnerIds = new Set(partners.map((partner) => partner.id));
    availableUsers = users.filter((user) => !partnerIds.has(user.id));
  });

  const selectUser = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.includes(user)
      ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
      : [...selectedUsers, user];
  };
</script>

<BaseModal on:close={() => dispatch('close')}>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <ImmichLogo width={24} />
      <p class="font-medium">Add partner</p>
    </span>
  </svelte:fragment>

  <div class="immich-scrollbar max-h-[300px] overflow-y-auto">
    {#if availableUsers.length > 0}
      {#each availableUsers as user}
        <button
          on:click={() => selectUser(user)}
          class="flex w-full place-items-center gap-4 px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {#if selectedUsers.includes(user)}
            <span
              class="flex h-12 w-12 place-content-center place-items-center rounded-full border bg-immich-primary text-3xl text-white dark:border-immich-dark-gray dark:bg-immich-dark-primary dark:text-immich-dark-bg"
              >✓</span
            >
          {:else}
            <UserAvatar {user} size="lg" />
          {/if}

          <div class="text-left">
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
      <p class="p-5 text-sm">
        Looks like you shared your photos with all users or you don't have any user to share with.
      </p>
    {/if}

    {#if selectedUsers.length > 0}
      <div class="flex place-content-end p-5">
        <Button size="sm" rounded="lg" on:click={() => dispatch('add-users', selectedUsers)}>Add</Button>
      </div>
    {/if}
  </div>
</BaseModal>
