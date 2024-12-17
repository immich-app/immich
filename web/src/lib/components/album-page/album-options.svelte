<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    updateAlbumInfo,
    removeUserFromAlbum,
    type AlbumResponseDto,
    type UserResponseDto,
    AssetOrder,
    AlbumUserRole,
    updateAlbumUser,
  } from '@immich/sdk';
  import { mdiArrowDownThin, mdiArrowUpThin, mdiPlus, mdiDotsVertical } from '@mdi/js';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingDropdown from '../shared-components/settings/setting-dropdown.svelte';
  import type { RenderedOption } from '../elements/dropdown.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { findKey } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';

  interface Props {
    album: AlbumResponseDto;
    order: AssetOrder | undefined;
    user: UserResponseDto;
    onChangeOrder: (order: AssetOrder) => void;
    onClose: () => void;
    onToggleEnabledActivity: () => void;
    onShowSelectSharedUser: () => void;
    onRemove: (userId: string) => void;
    onRefreshAlbum: () => void;
  }

  let {
    album,
    order,
    user,
    onChangeOrder,
    onClose,
    onToggleEnabledActivity,
    onShowSelectSharedUser,
    onRemove,
    onRefreshAlbum,
  }: Props = $props();

  let selectedRemoveUser: UserResponseDto | null = $state(null);

  const options: Record<AssetOrder, RenderedOption> = {
    [AssetOrder.Asc]: { icon: mdiArrowUpThin, title: $t('oldest_first') },
    [AssetOrder.Desc]: { icon: mdiArrowDownThin, title: $t('newest_first') },
  };

  let selectedOption = $derived(order ? options[order] : options[AssetOrder.Desc]);

  const handleToggle = async (returnedOption: RenderedOption): Promise<void> => {
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
      onChangeOrder(order);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };

  const handleMenuRemove = (user: UserResponseDto): void => {
    selectedRemoveUser = user;
  };

  const handleRemoveUser = async (): Promise<void> => {
    if (!selectedRemoveUser) {
      return;
    }
    try {
      await removeUserFromAlbum({ id: album.id, userId: selectedRemoveUser.id });
      onRemove(selectedRemoveUser.id);
      notificationController.show({
        type: NotificationType.Info,
        message: $t('album_user_removed', { values: { user: selectedRemoveUser.name } }),
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_album_users'));
    } finally {
      selectedRemoveUser = null;
    }
  };

  const handleUpdateSharedUserRole = async (user: UserResponseDto, role: AlbumUserRole) => {
    try {
      await updateAlbumUser({ id: album.id, userId: user.id, updateAlbumUserDto: { role } });
      const message = $t('user_role_set', {
        values: { user: user.name, role: role == AlbumUserRole.Viewer ? $t('role_viewer') : $t('role_editor') },
      });
      onRefreshAlbum();
      notificationController.show({ type: NotificationType.Info, message });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_album_user_role'));
    } finally {
      selectedRemoveUser = null;
    }
  };
</script>

{#if !selectedRemoveUser}
  <FullScreenModal title={$t('options')} {onClose}>
    <div class="items-center justify-center">
      <div class="py-2">
        <h2 class="text-gray text-sm mb-2">{$t('settings').toUpperCase()}</h2>
        <div class="grid p-2 gap-y-2">
          {#if order}
            <SettingDropdown
              title={$t('display_order')}
              options={Object.values(options)}
              selectedOption={options[order]}
              onToggle={handleToggle}
            />
          {/if}
          <SettingSwitch
            title={$t('comments_and_likes')}
            subtitle={$t('let_others_respond')}
            checked={album.isActivityEnabled}
            onToggle={onToggleEnabledActivity}
          />
        </div>
      </div>
      <div class="py-2">
        <div class="text-gray text-sm mb-3">{$t('people').toUpperCase()}</div>
        <div class="p-2">
          <button type="button" class="flex items-center gap-2" onclick={onShowSelectSharedUser}>
            <div class="rounded-full w-10 h-10 border border-gray-500 flex items-center justify-center">
              <div><Icon path={mdiPlus} size="25" /></div>
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
                <ButtonContextMenu icon={mdiDotsVertical} size="20" title={$t('options')}>
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
                  <MenuOption onClick={() => handleMenuRemove(user)} text={$t('remove')} />
                </ButtonContextMenu>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </FullScreenModal>
{/if}

{#if selectedRemoveUser}
  <ConfirmDialog
    title={$t('album_remove_user')}
    prompt={$t('album_remove_user_confirmation', { values: { user: selectedRemoveUser.name } })}
    confirmText={$t('remove_user')}
    onConfirm={handleRemoveUser}
    onCancel={() => (selectedRemoveUser = null)}
  />
{/if}
