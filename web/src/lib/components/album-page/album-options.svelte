<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    updateAlbumInfo,
    removeUserFromAlbum,
    type AlbumResponseDto,
    type UserResponseDto,
    AssetOrder,
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

  export let album: AlbumResponseDto;
  export let order: AssetOrder | undefined;
  export let user: UserResponseDto; // Declare user as a prop
  export let onChangeOrder: (order: AssetOrder) => void;
  export let onClose: () => void;
  export let onToggleEnabledActivity: () => void;
  export let onShowSelectSharedUser: () => void;
  export let onRemove: (userId: string) => void;

  let selectedRemoveUser: UserResponseDto | null = null;

  const options: Record<AssetOrder, RenderedOption> = {
    [AssetOrder.Asc]: { icon: mdiArrowUpThin, title: $t('oldest_first') },
    [AssetOrder.Desc]: { icon: mdiArrowDownThin, title: $t('newest_first') },
  };

  $: selectedOption = order ? options[order] : options[AssetOrder.Desc];

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
          <button type="button" class="flex items-center gap-2" on:click={onShowSelectSharedUser}>
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

          {#each album.albumUsers as { user } (user.id)}
            <div class="flex items-center gap-2 py-2">
              <div>
                <UserAvatar {user} size="md" />
              </div>
              <div class="w-full">{user.name}</div>
              {#if user.id !== album.ownerId}
                <!-- Allow deletion for non-owners -->
                <ButtonContextMenu icon={mdiDotsVertical} size="20" title={$t('options')}>
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
