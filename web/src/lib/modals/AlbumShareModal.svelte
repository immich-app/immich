<script lang="ts">
  import AlbumSharedLink from '$lib/components/album-page/album-shared-link.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import GroupAvatar from '$lib/components/shared-components/GroupAvatar.svelte';
  import { AppRoute } from '$lib/constants';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import { makeSharedLinkUrl } from '$lib/utils';
  import {
    addGroupsToAlbum,
    addUsersToAlbum,
    AlbumUserRole,
    getAllSharedLinks,
    getGroupsForAlbum,
    searchMyGroups,
    searchUsers,
    type AlbumResponseDto,
    type GroupResponseDto,
    type SharedLinkResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Heading, Link, Modal, ModalBody, Stack, Text } from '@immich/ui';
  import { mdiCheck, mdiEye, mdiLink, mdiPencil } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import UserAvatar from '../components/shared-components/user-avatar.svelte';

  interface Props {
    album: AlbumResponseDto;
    onClose: (action?: 'sharedLink' | 'update') => void;
  }

  let { album, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  let groups: GroupResponseDto[] = $state([]);

  let selectedUsers: Record<string, { item: UserResponseDto; role: AlbumUserRole }> = $state({});
  let selectedGroups: Record<string, { item: GroupResponseDto; role: AlbumUserRole }> = $state({});

  type SelectedItem =
    | { type: 'user'; item: UserResponseDto; role: AlbumUserRole }
    | { type: 'group'; item: GroupResponseDto; role: AlbumUserRole };

  const selectedItems: SelectedItem[] = $derived([
    ...Object.values(selectedGroups).map((item) => ({ ...item, type: 'group' }) as const),
    ...Object.values(selectedUsers).map((item) => ({ ...item, type: 'user' }) as const),
  ]);

  let sharedLinkUrl = $state('');
  const handleViewQrCode = (sharedLink: SharedLinkResponseDto) => {
    sharedLinkUrl = makeSharedLinkUrl(sharedLink);
  };

  const roleOptions: Array<{ title: string; value: AlbumUserRole | 'none'; icon?: string }> = [
    { title: $t('role_editor'), value: AlbumUserRole.Editor, icon: mdiPencil },
    { title: $t('role_viewer'), value: AlbumUserRole.Viewer, icon: mdiEye },
    { title: $t('remove'), value: 'none' },
  ];

  let sharedLinks: SharedLinkResponseDto[] = $state([]);
  onMount(async () => {
    sharedLinks = await getAllSharedLinks({ albumId: album.id });
    const [allUsers, allMyGroups, albumGroups] = await Promise.all([
      searchUsers(),
      searchMyGroups(),
      getGroupsForAlbum({ id: album.id }),
    ]);

    users = allUsers
      .filter((user) => user.id !== album.ownerId)
      .filter((user) => !album.albumUsers.some(({ user: sharedUser }) => user.id === sharedUser.id));

    groups = allMyGroups.filter((myGroup) => !albumGroups.some(({ id }) => myGroup.id === id));
  });

  const handleToggleUser = (user: UserResponseDto) => {
    if (Object.keys(selectedUsers).includes(user.id)) {
      delete selectedUsers[user.id];
    } else {
      selectedUsers[user.id] = { item: user, role: AlbumUserRole.Editor };
    }
  };

  const handleToggleGroups = (group: GroupResponseDto) => {
    if (Object.keys(selectedGroups).includes(group.id)) {
      delete selectedGroups[group.id];
    } else {
      selectedGroups[group.id] = { item: group, role: AlbumUserRole.Editor };
    }
  };

  const handleChangeRole = (selectedItem: SelectedItem, role: AlbumUserRole | 'none') => {
    const { item, type } = selectedItem;

    if (role === 'none') {
      if (type === 'user') {
        delete selectedUsers[item.id];
      } else {
        delete selectedGroups[item.id];
      }
    } else {
      selectedItem.role = role;
    }
  };

  const handleAdd = async () => {
    const albumUsers = Object.values(selectedUsers).map(({ item: user, ...rest }) => ({ userId: user.id, ...rest }));
    if (albumUsers.length > 0) {
      await addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          albumUsers,
        },
      });
    }

    const groups = Object.values(selectedGroups).map(({ item: group, ...rest }) => ({ groupId: group.id, ...rest }));
    if (groups.length > 0) {
      await addGroupsToAlbum({
        id: album.id,
        albumGroupCreateAllDto: {
          groups,
        },
      });
    }

    onClose('update');
    selectedUsers = {};
    selectedGroups = {};
    sharedLinks = await getAllSharedLinks({ albumId: album.id });
  };
</script>

{#if sharedLinkUrl}
  <QrCodeModal title={$t('view_link')} onClose={() => (sharedLinkUrl = '')} value={sharedLinkUrl} />
{:else}
  <Modal size="small" title={$t('share')} {onClose}>
    <ModalBody>
      {#if selectedItems.length > 0}
        <div class="mb-2 py-2 sticky">
          <Heading size="tiny">{$t('selected')}</Heading>
          <div class="flex my-2 flex-col gap-2">
            {#each selectedItems as selectedItem (selectedItem.item.id)}
              <div class="flex place-items-center gap-2 px-2">
                {#if selectedItem.type === 'group'}
                  <GroupAvatar group={selectedItem.item} />
                  <div class="text-start grow p-2">
                    <p class="text-immich-fg dark:text-immich-dark-fg">
                      {selectedItem.item.name}
                    </p>
                    <p class="text-xs">
                      {selectedItem.item.description}
                    </p>
                  </div>
                {:else}
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full border bg-green-600 text-3xl text-white"
                  >
                    <Icon path={mdiCheck} size={24} />
                  </div>
                  <div class="text-start grow p-2">
                    <p class="text-immich-fg dark:text-immich-dark-fg">
                      {selectedItem.item.name}
                    </p>
                    <p class="text-xs">
                      {selectedItem.item.email}
                    </p>
                  </div>
                {/if}

                <Dropdown
                  title={$t('role')}
                  options={roleOptions}
                  render={({ title, icon }) => ({ title, icon })}
                  onSelect={({ value }) => handleChangeRole(selectedItem, value)}
                />
              </div>
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
          <Heading size="tiny">{$t('users')}</Heading>

          <div class="my-2">
            {#each users as user (user.id)}
              {#if !Object.keys(selectedUsers).includes(user.id)}
                <div
                  class="flex place-items-center transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl gap-2"
                >
                  <button
                    type="button"
                    onclick={() => handleToggleUser(user)}
                    class="flex w-full place-items-center gap-4 p-2"
                  >
                    <UserAvatar {user} size="md" />
                    <div class="text-start grow">
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

        {#if groups.length > 0 && groups.length !== Object.keys(selectedGroups).length}
          <Heading size="tiny">{$t('groups')}</Heading>

          <div class="my-2">
            {#each groups as group (group.id)}
              {#if !Object.keys(selectedGroups).includes(group.id)}
                <div class="flex place-items-center transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
                  <button
                    type="button"
                    onclick={() => handleToggleGroups(group)}
                    class="flex w-full place-items-center gap-4 p-2"
                  >
                    <GroupAvatar {group} />
                    <div class="text-start grow">
                      <p class="text-immich-fg dark:text-immich-dark-fg">
                        {group.name}
                      </p>
                      <p class="text-xs">
                        {group.description}
                      </p>
                    </div>
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>

      {#if users.length > 0 || groups.length > 0}
        <div class="py-3">
          <Button size="small" fullWidth shape="round" disabled={selectedItems.length === 0} onclick={handleAdd}>
            {$t('add')}
          </Button>
        </div>
      {/if}

      <hr class="my-4" />

      <Stack gap={6}>
        {#if sharedLinks.length > 0}
          <div class="flex justify-between items-center">
            <Text>{$t('shared_links')}</Text>
            <Link href={AppRoute.SHARED_LINKS} onclick={() => onClose()} class="text-sm">{$t('view_all')}</Link>
          </div>

          <Stack gap={4}>
            {#each sharedLinks as sharedLink (sharedLink.id)}
              <AlbumSharedLink {album} {sharedLink} onViewQrCode={() => handleViewQrCode(sharedLink)} />
            {/each}
          </Stack>
        {/if}

        <Button leadingIcon={mdiLink} size="small" shape="round" fullWidth onclick={() => onClose('sharedLink')}
          >{$t('create_link')}</Button
        >
      </Stack>
    </ModalBody>
  </Modal>
{/if}
