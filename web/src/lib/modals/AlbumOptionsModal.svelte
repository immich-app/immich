<script lang="ts">
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import type { RenderedOption } from '$lib/elements/Dropdown.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    AlbumUserRole,
    AssetOrder,
    removeUserFromAlbum,
    updateAlbumInfo,
    updateAlbumUser,
    type AlbumResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Icon, Modal, ModalBody, modalManager } from '@immich/ui';
  import { mdiArrowDownThin, mdiArrowUpThin, mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { findKey } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { notificationController, NotificationType } from '../components/shared-components/notification/notification';
  import SettingDropdown from '../components/shared-components/settings/setting-dropdown.svelte';

  interface Props {
    album: AlbumResponseDto;
    order: AssetOrder | undefined;
    user: UserResponseDto;
    onClose: (
      result?: { action: 'changeOrder'; order: AssetOrder } | { action: 'shareUser' } | { action: 'refreshAlbum' },
    ) => void;
  }

  let { album, order, user, onClose }: Props = $props();

  const options: Record<AssetOrder, RenderedOption> = {
    [AssetOrder.Asc]: { icon: mdiArrowUpThin, title: $t('oldest_first') },
    [AssetOrder.Desc]: { icon: mdiArrowDownThin, title: $t('newest_first') },
  };

  let selectedOption = $derived(order ? options[order] : options[AssetOrder.Desc]);

  const handleToggleOrder = async (returnedOption: RenderedOption): Promise<void> => {
    if (selectedOption === returnedOption) {
      return;
    }
    let order: AssetOrder = AssetOrder.Desc;
    order = findKey(options, (option) => option === returnedOption) as AssetOrder;

    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          order,
        },
      });
      onClose({ action: 'changeOrder', order });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };

  const handleToggleActivity = async () => {
    try {
      album = await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          isActivityEnabled: !album.isActivityEnabled,
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: $t('activity_changed', { values: { enabled: album.isActivityEnabled } }),
      });
    } catch (error) {
      handleError(error, $t('errors.cant_change_activity', { values: { enabled: album.isActivityEnabled } }));
    }
  };

  const handleRemoveUser = async (user: UserResponseDto): Promise<void> => {
    const confirmed = await modalManager.showDialog({
      title: $t('album_remove_user'),
      prompt: $t('album_remove_user_confirmation', { values: { user: user.name } }),
      confirmText: $t('remove_user'),
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeUserFromAlbum({ id: album.id, userId: user.id });
      onClose({ action: 'refreshAlbum' });
      notificationController.show({
        type: NotificationType.Info,
        message: $t('album_user_removed', { values: { user: user.name } }),
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_album_users'));
    }
  };

  const handleUpdateSharedUserRole = async (user: UserResponseDto, role: AlbumUserRole) => {
    try {
      await updateAlbumUser({ id: album.id, userId: user.id, updateAlbumUserDto: { role } });
      const message = $t('user_role_set', {
        values: { user: user.name, role: role == AlbumUserRole.Viewer ? $t('role_viewer') : $t('role_editor') },
      });
      onClose({ action: 'refreshAlbum' });
      notificationController.show({ type: NotificationType.Info, message });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_album_user_role'));
    }
  };
</script>

<Modal title={$t('options')} onClose={() => onClose({ action: 'refreshAlbum' })} size="small">
  <ModalBody>
    <div class="items-center justify-center">
      <div class="py-2">
        <h2 class="uppercase text-gray text-sm mb-2">{$t('settings')}</h2>
        <div class="grid p-2 gap-y-2">
          {#if order}
            <SettingDropdown
              title={$t('display_order')}
              options={Object.values(options)}
              selectedOption={options[order]}
              onToggle={handleToggleOrder}
            />
          {/if}
          <SettingSwitch
            title={$t('comments_and_likes')}
            subtitle={$t('let_others_respond')}
            checked={album.isActivityEnabled}
            onToggle={handleToggleActivity}
          />
        </div>
      </div>
      <div class="py-2">
        <div class="uppercase text-gray text-sm mb-3">{$t('people')}</div>
        <div class="p-2">
          <button type="button" class="flex items-center gap-2" onclick={() => onClose({ action: 'shareUser' })}>
            <div class="rounded-full w-10 h-10 border border-gray-500 flex items-center justify-center">
              <div><Icon icon={mdiPlus} size="25" /></div>
            </div>
            <div>{$t('invite_people')}</div>
          </button>

          <div class="flex items-center gap-2 py-2 mt-2">
            <div>
              <UserAvatar {user} size="md" />
            </div>
            <div class="w-full">{user.name}</div>
            <div>{$t('owner')}</div>
          </div>

          {#each album.albumUsers as { user, role } (user.id)}
            <div class="flex items-center gap-2 py-2">
              <div>
                <UserAvatar {user} size="md" />
              </div>
              <div class="w-full">{user.name}</div>
              {#if role === AlbumUserRole.Viewer}
                {$t('role_viewer')}
              {:else}
                {$t('role_editor')}
              {/if}
              {#if user.id !== album.ownerId}
                <ButtonContextMenu icon={mdiDotsVertical} size="medium" title={$t('options')}>
                  {#if role === AlbumUserRole.Viewer}
                    <MenuOption
                      onClick={() => handleUpdateSharedUserRole(user, AlbumUserRole.Editor)}
                      text={$t('allow_edits')}
                    />
                  {:else}
                    <MenuOption
                      onClick={() => handleUpdateSharedUserRole(user, AlbumUserRole.Viewer)}
                      text={$t('disallow_edits')}
                    />
                  {/if}
                  <!-- Allow deletion for non-owners -->
                  <MenuOption onClick={() => handleRemoveUser(user)} text={$t('remove')} />
                </ButtonContextMenu>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </ModalBody>
</Modal>
