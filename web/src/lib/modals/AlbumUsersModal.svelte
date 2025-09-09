<script lang="ts">
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    AlbumUserRole,
    getMyUser,
    removeUserFromAlbum,
    updateAlbumUser,
    type AlbumResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Modal, ModalBody, Text, modalManager } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onClose: (changed?: boolean) => void;
  }

  let { album, onClose }: Props = $props();

  let currentUser: UserResponseDto | undefined = $state();

  let isOwned = $derived(currentUser?.id == album.ownerId);

  // Map contributor counts by user id (owner + collaborators)
  type ContributorCount = { userId: string; assetCount: number };
  const contributorMap = $derived(
    Object.fromEntries(
      (((album as any)?.contributorCounts ?? []) as ContributorCount[]).map((c) => [c.userId, c.assetCount]),
    ) as Record<string, number>,
  );
  const getCount = (userId: string) => contributorMap[userId] ?? 0;

  onMount(async () => {
    try {
      currentUser = await getMyUser();
    } catch (error) {
      handleError(error, $t('errors.unable_to_refresh_user'));
    }
  });

  const handleRemoveUser = async (user: UserResponseDto) => {
    if (!user) {
      return;
    }

    const userId = user.id === currentUser?.id ? 'me' : user.id;
    let confirmed: boolean | undefined;

    // eslint-disable-next-line unicorn/prefer-ternary
    if (userId === 'me') {
      confirmed = await modalManager.showDialog({
        title: $t('album_leave'),
        prompt: $t('album_leave_confirmation', { values: { album: album.albumName } }),
        confirmText: $t('leave'),
      });
    } else {
      confirmed = await modalManager.showDialog({
        title: $t('album_remove_user'),
        prompt: $t('album_remove_user_confirmation', { values: { user: user.name } }),
        confirmText: $t('remove_user'),
      });
    }

    if (!confirmed) {
      return;
    }

    try {
      await removeUserFromAlbum({ id: album.id, userId });
      const message =
        userId === 'me'
          ? $t('album_user_left', { values: { album: album.albumName } })
          : $t('album_user_removed', { values: { user: user.name } });
      notificationController.show({ type: NotificationType.Info, message });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_album_users'));
    }
  };

  const handleSetReadonly = async (user: UserResponseDto, role: AlbumUserRole) => {
    try {
      await updateAlbumUser({ id: album.id, userId: user.id, updateAlbumUserDto: { role } });
      const message = $t('user_role_set', {
        values: { user: user.name, role: role == AlbumUserRole.Viewer ? $t('role_viewer') : $t('role_editor') },
      });

      notificationController.show({ type: NotificationType.Info, message });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_album_user_role'));
    }
  };
</script>

<Modal title={$t('options')} size="small" {onClose}>
  <ModalBody>
    <section class="immich-scrollbar max-h-[400px] overflow-y-auto pb-4">
      <div class="flex w-full place-items-center justify-between gap-4 p-5">
        <div class="flex place-items-center gap-4">
          <UserAvatar user={album.owner} size="md" />
          <div>
            <p class="text-sm font-medium">{album.owner.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {$t('items_count', { values: { count: getCount(album.owner.id) } })}
            </p>
          </div>
        </div>

        <div id="icon-{album.owner.id}" class="flex place-items-center">
          <p class="text-sm">{$t('owner')}</p>
        </div>
      </div>
      {#each album.albumUsers as { user, role } (user.id)}
        <div
          class="flex w-full place-items-center justify-between gap-4 p-5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
      {#each [{ user: album.owner, role: 'owner' }, ...album.albumUsers] as { user, role } (user.id)}
        <div class="flex w-full place-items-center justify-between gap-4 p-5 rounded-xl transition-colors">
          <div class="flex place-items-center gap-4">
            <UserAvatar {user} size="md" />
            <div class="flex flex-col">
              <div>
              <p class="font-medium">{user.name}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {$t('items_count', { values: { count: getCount(user.id) } })}
              </p>
            </div>
              <Text color="muted" size="tiny">
                {#if role === 'owner'}
                  {$t('owner')}
                {:else if role === AlbumUserRole.Viewer}
                  {$t('role_viewer')}
                {:else}
                  {$t('role_editor')}
                {/if}
              </Text>
            </div>
          </div>

          <div id="icon-{user.id}" class="flex place-items-center">
            {#if isOwned}
              <ButtonContextMenu icon={mdiDotsVertical} size="medium" title={$t('options')}>
                {#if role === AlbumUserRole.Viewer}
                  <MenuOption onClick={() => handleSetReadonly(user, AlbumUserRole.Editor)} text={$t('allow_edits')} />
                {:else}
                  <MenuOption
                    onClick={() => handleSetReadonly(user, AlbumUserRole.Viewer)}
                    text={$t('disallow_edits')}
                  />
                {/if}
                <MenuOption onClick={() => handleRemoveUser(user)} text={$t('remove')} />
              </ButtonContextMenu>
            {:else if user.id == currentUser?.id}
              <Button shape="round" variant="ghost" leadingIcon={undefined} onclick={() => handleRemoveUser(user)}
                >{$t('leave')}</Button
              >
            {/if}
          </div>
        </div>
      {/each}
    </section>
  </ModalBody>
</Modal>
