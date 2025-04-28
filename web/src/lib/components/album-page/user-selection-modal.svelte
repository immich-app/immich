<script lang="ts">
  import AlbumSharedLink from '$lib/components/album-page/album-shared-link.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import QrCodeModal from '$lib/components/shared-components/qr-code-modal.svelte';
  import { AppRoute } from '$lib/constants';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { makeSharedLinkUrl } from '$lib/utils';
  import {
    AlbumUserRole,
    getAllSharedLinks,
    searchUsers,
    type AlbumResponseDto,
    type AlbumUserAddDto,
    type SharedLinkResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Link, Stack, Text } from '@immich/ui';
  import { mdiCheck, mdiEye, mdiLink, mdiPencil } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import UserAvatar from '../shared-components/user-avatar.svelte';

  interface Props {
    album: AlbumResponseDto;
    onClose: () => void;
    onSelect: (selectedUsers: AlbumUserAddDto[]) => void;
    onShare: () => void;
  }

  let { album, onClose, onSelect, onShare }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  let selectedUsers: Record<string, { user: UserResponseDto; role: AlbumUserRole }> = $state({});

  let sharedLinkUrl = $state('');
  const handleViewQrCode = (sharedLink: SharedLinkResponseDto) => {
    sharedLinkUrl = makeSharedLinkUrl($serverConfig.externalDomain, sharedLink.key);
  };

  const roleOptions: Array<{ title: string; value: AlbumUserRole | 'none'; icon?: string }> = [
    { title: $t('role_editor'), value: AlbumUserRole.Editor, icon: mdiPencil },
    { title: $t('role_viewer'), value: AlbumUserRole.Viewer, icon: mdiEye },
    { title: $t('remove_user'), value: 'none' },
  ];

  let sharedLinks: SharedLinkResponseDto[] = $state([]);
  onMount(async () => {
    sharedLinks = await getAllSharedLinks({ albumId: album.id });
    const data = await searchUsers();

    // remove album owner
    users = data.filter((user) => user.id !== album.ownerId);

    // Remove the existed shared users from the album
    for (const sharedUser of album.albumUsers) {
      users = users.filter((user) => user.id !== sharedUser.user.id);
    }
  });

  const handleToggle = (user: UserResponseDto) => {
    if (Object.keys(selectedUsers).includes(user.id)) {
      delete selectedUsers[user.id];
    } else {
      selectedUsers[user.id] = { user, role: AlbumUserRole.Editor };
    }
  };

  const handleChangeRole = (user: UserResponseDto, role: AlbumUserRole | 'none') => {
    if (role === 'none') {
      delete selectedUsers[user.id];
    } else {
      selectedUsers[user.id].role = role;
    }
  };
</script>

{#if sharedLinkUrl}
  <QrCodeModal title={$t('view_link')} onClose={() => (sharedLinkUrl = '')} value={sharedLinkUrl} />
{:else}
  <FullScreenModal title={$t('share')} showLogo {onClose}>
    {#if Object.keys(selectedUsers).length > 0}
      <div class="mb-2 py-2 sticky">
        <p class="text-xs font-medium">{$t('selected')}</p>
        <div class="my-2">
          {#each Object.values(selectedUsers) as { user } (user.id)}
            {#key user.id}
              <div class="flex place-items-center gap-4 p-4">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full border bg-immich-dark-success text-3xl text-white dark:border-immich-dark-gray dark:bg-immich-dark-success"
                >
                  <Icon path={mdiCheck} size={24} />
                </div>

                <!-- <UserAvatar {user} size="md" /> -->
                <div class="text-start flex-grow">
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
        <Text>{$t('users')}</Text>

        <div class="my-2">
          {#each users as user (user.id)}
            {#if !Object.keys(selectedUsers).includes(user.id)}
              <div class="flex place-items-center transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
                <button
                  type="button"
                  onclick={() => handleToggle(user)}
                  class="flex w-full place-items-center gap-4 p-4"
                >
                  <UserAvatar {user} size="md" />
                  <div class="text-start flex-grow">
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
          size="small"
          fullWidth
          shape="round"
          disabled={Object.keys(selectedUsers).length === 0}
          onclick={() =>
            onSelect(Object.values(selectedUsers).map(({ user, ...rest }) => ({ userId: user.id, ...rest })))}
          >{$t('add')}</Button
        >
      </div>
    {/if}

    <hr class="my-4" />

    <Stack gap={6}>
      {#if sharedLinks.length > 0}
        <div class="flex justify-between items-center">
          <Text>{$t('shared_links')}</Text>
          <Link href={AppRoute.SHARED_LINKS} class="text-sm">{$t('view_all')}</Link>
        </div>

        <Stack gap={4}>
          {#each sharedLinks as sharedLink (sharedLink.id)}
            <AlbumSharedLink {album} {sharedLink} onViewQrCode={() => handleViewQrCode(sharedLink)} />
          {/each}
        </Stack>
      {/if}

      <Button leadingIcon={mdiLink} size="small" shape="round" fullWidth onclick={onShare}>{$t('create_link')}</Button>
    </Stack>
  </FullScreenModal>
{/if}
