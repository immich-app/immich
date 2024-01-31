<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { type AlbumResponseDto, api, type SharedLinkResponseDto, type UserResponseDto } from '@api';
  import BaseModal from '../shared-components/base-modal.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import { goto } from '$app/navigation';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiCheck, mdiLink, mdiShareCircle } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let album: AlbumResponseDto;
  let users: UserResponseDto[] = [];
  let selectedUsers: UserResponseDto[] = [];

  const dispatch = createEventDispatcher<{
    select: UserResponseDto[];
    share: void;
    close: void;
  }>();
  let sharedLinks: SharedLinkResponseDto[] = [];
  onMount(async () => {
    await getSharedLinks();
    const { data } = await api.userApi.getAllUsers({ isAll: false });

    // remove invalid users
    users = data.filter((user) => !(user.deletedAt || user.id === album.ownerId));

    // Remove the existed shared users from the album
    for (const sharedUser of album.sharedUsers) {
      users = users.filter((user) => user.id !== sharedUser.id);
    }
  });

  const getSharedLinks = async () => {
    const { data } = await api.sharedLinkApi.getAllSharedLinks();

    sharedLinks = data.filter((link) => link.album?.id === album.id);
  };

  const handleSelect = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.includes(user)
      ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
      : [...selectedUsers, user];
  };

  const handleUnselect = (user: UserResponseDto) => {
    selectedUsers = selectedUsers.filter((selectedUser) => selectedUser.id !== user.id);
  };
</script>

<BaseModal on:close={() => dispatch('close')}>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <ImmichLogo width={24} />
      <p class="font-medium">Invite to album</p>
    </span>
  </svelte:fragment>

  {#if selectedUsers.length > 0}
    <div class="mb-2 flex flex-wrap place-items-center gap-4 overflow-x-auto px-5 py-2 sticky">
      <p class="font-medium">To</p>

      {#each selectedUsers as user}
        {#key user.id}
          <button
            on:click={() => handleUnselect(user)}
            class="flex place-items-center gap-1 rounded-full border border-gray-500 p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <UserAvatar {user} size="sm" />
            <p class="text-xs font-medium">{user.name}</p>
          </button>
        {/key}
      {/each}
    </div>
  {/if}

  <div class="immich-scrollbar max-h-[500px] overflow-y-auto">
    {#if users.length > 0}
      <p class="px-5 text-xs font-medium">SUGGESTIONS</p>

      <div class="my-4">
        {#each users as user}
          <button
            on:click={() => handleSelect(user)}
            class="flex w-full place-items-center gap-4 px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {#if selectedUsers.includes(user)}
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border bg-immich-primary text-3xl text-white dark:border-immich-dark-gray dark:bg-immich-dark-primary dark:text-immich-dark-bg"
              >
                <Icon path={mdiCheck} size={24} />
              </div>
            {:else}
              <UserAvatar {user} size="md" />
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
      </div>
    {:else}
      <p class="p-5 text-sm">
        Looks like you have shared this album with all users or you don't have any user to share with.
      </p>
    {/if}
  </div>

  {#if users.length > 0}
    <div class="p-3">
      <Button
        size="sm"
        fullwidth
        rounded="full"
        disabled={selectedUsers.length === 0}
        on:click={() => dispatch('select', selectedUsers)}>Add</Button
      >
    </div>
  {/if}

  <hr />

  <div id="shared-buttons" class="my-4 flex place-content-center place-items-center justify-around">
    <button
      class="flex flex-col place-content-center place-items-center gap-2 hover:cursor-pointer"
      on:click={() => dispatch('share')}
    >
      <Icon path={mdiLink} size={24} />
      <p class="text-sm">Create link</p>
    </button>

    {#if sharedLinks.length}
      <button
        class="flex flex-col place-content-center place-items-center gap-2 hover:cursor-pointer"
        on:click={() => goto(AppRoute.SHARED_LINKS)}
      >
        <Icon path={mdiShareCircle} size={24} />
        <p class="text-sm">View links</p>
      </button>
    {/if}
  </div>
</BaseModal>
