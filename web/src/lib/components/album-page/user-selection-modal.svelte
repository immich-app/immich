<script lang="ts">
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { AppRoute } from '$lib/constants';
  import {
    AlbumUserRole,
    getAllSharedLinks,
    searchUsers,
    type AlbumResponseDto,
    type AlbumUserAddDto,
    type SharedLinkResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { mdiCheck, mdiEye, mdiLink, mdiPencil, mdiShareCircle } from '@mdi/js';
  import { onMount } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
  export let onClose: () => void;
  export let onSelect: (selectedUsers: AlbumUserAddDto[]) => void;
  export let onShare: () => void;

  let users: UserResponseDto[] = [];
  let selectedUsers: Record<string, { user: UserResponseDto; role: AlbumUserRole }> = {};

  const roleOptions: Array<{ title: string; value: AlbumUserRole | 'none'; icon?: string }> = [
    { title: $t('role_editor'), value: AlbumUserRole.Editor, icon: mdiPencil },
    { title: $t('role_viewer'), value: AlbumUserRole.Viewer, icon: mdiEye },
    { title: $t('remove_user'), value: 'none' },
  ];

  let sharedLinks: SharedLinkResponseDto[] = [];
  onMount(async () => {
    await getSharedLinks();
    const data = await searchUsers();

    // remove album owner
    users = data.filter((user) => user.id !== album.ownerId);

    // Remove the existed shared users from the album
    for (const sharedUser of album.albumUsers) {
      users = users.filter((user) => user.id !== sharedUser.user.id);
    }
  });

  const getSharedLinks = async () => {
    const data = await getAllSharedLinks();
    sharedLinks = data.filter((link) => link.album?.id === album.id);
  };

  const handleToggle = (user: UserResponseDto) => {
    if (Object.keys(selectedUsers).includes(user.id)) {
      delete selectedUsers[user.id];
      selectedUsers = selectedUsers;
    } else {
      selectedUsers[user.id] = { user, role: AlbumUserRole.Editor };
    }
  };

  const handleChangeRole = (user: UserResponseDto, role: AlbumUserRole | 'none') => {
    if (role === 'none') {
      delete selectedUsers[user.id];
      selectedUsers = selectedUsers;
    } else {
      selectedUsers[user.id].role = role;
    }
  };
</script>

<FullScreenModal title={$t('invite_to_album')} showLogo {onClose}>
  {#if Object.keys(selectedUsers).length > 0}
    <div class="mb-2 py-2 sticky">
      <p class="text-xs font-medium">{$t('selected').toUpperCase()}</p>
      <div class="my-2">
        {#each Object.values(selectedUsers) as { user }}
          {#key user.id}
            <div class="flex place-items-center gap-4 p-4">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border bg-immich-dark-success text-3xl text-white dark:border-immich-dark-gray dark:bg-immich-dark-success"
              >
                <Icon path={mdiCheck} size={24} />
              </div>

              <!-- <UserAvatar {user} size="md" /> -->
              <div class="text-left flex-grow">
                <p class="text-immich-fg dark:text-immich-dark-fg">
                  {user.name}
                </p>
                <p class="text-xs">
                  {user.email}
                </p>
              </div>

              <Dropdown
                title={$t('role')}
                options={roleOptions}
                render={({ title, icon }) => ({ title, icon })}
                onSelect={({ value }) => handleChangeRole(user, value)}
              />
            </div>
          {/key}
        {/each}
      </div>
    </div>
  {/if}

  {#if users.length + Object.keys(selectedUsers).length === 0}
    <p class="p-5 text-sm">
      {$t('album_share_no_users')}
    </p>
  {/if}

  <div class="immich-scrollbar max-h-[500px] overflow-y-auto">
    {#if users.length > 0 && users.length !== Object.keys(selectedUsers).length}
      <p class="text-xs font-medium">{$t('suggestions').toUpperCase()}</p>

      <div class="my-2">
        {#each users as user}
          {#if !Object.keys(selectedUsers).includes(user.id)}
            <div class="flex place-items-center transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
              <button
                type="button"
                on:click={() => handleToggle(user)}
                class="flex w-full place-items-center gap-4 p-4"
              >
                <UserAvatar {user} size="md" />
                <div class="text-left flex-grow">
                  <p class="text-immich-fg dark:text-immich-dark-fg">
                    {user.name}
                  </p>
                  <p class="text-xs">
                    {user.email}
                  </p>
                </div>
              </button>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  {#if users.length > 0}
    <div class="py-3">
      <Button
        size="sm"
        fullwidth
        rounded="full"
        disabled={Object.keys(selectedUsers).length === 0}
        on:click={() =>
          onSelect(Object.values(selectedUsers).map(({ user, ...rest }) => ({ userId: user.id, ...rest })))}
        >{$t('add')}</Button
      >
    </div>
  {/if}

  <hr />

  <div id="shared-buttons" class="mt-4 flex place-content-center place-items-center justify-around">
    <button
      type="button"
      class="flex flex-col place-content-center place-items-center gap-2 hover:cursor-pointer"
      on:click={onShare}
    >
      <Icon path={mdiLink} size={24} />
      <p class="text-sm">{$t('create_link')}</p>
    </button>

    {#if sharedLinks.length}
      <a
        href={AppRoute.SHARED_LINKS}
        class="flex flex-col place-content-center place-items-center gap-2 hover:cursor-pointer"
      >
        <Icon path={mdiShareCircle} size={24} />
        <p class="text-sm">{$t('view_links')}</p>
      </a>
    {/if}
  </div>
</FullScreenModal>
