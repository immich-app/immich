<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { type AlbumResponseDto, api, type UserResponseDto } from '@api';
  import BaseModal from '../shared-components/base-modal.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { handleError } from '../../utils/handle-error';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { getContextMenuPosition } from '../../utils/context-menu';
  import { mdiDotsVertical } from '@mdi/js';

  export let album: AlbumResponseDto;

  const dispatch = createEventDispatcher<{
    remove: string;
    close: void;
  }>();

  let currentUser: UserResponseDto;
  let position = { x: 0, y: 0 };
  let selectedMenuUser: UserResponseDto | null = null;
  let selectedRemoveUser: UserResponseDto | null = null;

  $: isOwned = currentUser?.id == album.ownerId;

  onMount(async () => {
    try {
      const { data } = await api.userApi.getMyUserInfo();
      currentUser = data;
    } catch (error) {
      handleError(error, 'Unable to refresh user');
    }
  });

  const showContextMenu = (event: MouseEvent, user: UserResponseDto) => {
    position = getContextMenuPosition(event);
    selectedMenuUser = user;
    selectedRemoveUser = null;
  };

  const handleMenuRemove = () => {
    selectedRemoveUser = selectedMenuUser;
    selectedMenuUser = null;
  };

  const handleRemoveUser = async () => {
    if (!selectedRemoveUser) {
      return;
    }

    const userId = selectedRemoveUser.id === currentUser?.id ? 'me' : selectedRemoveUser.id;

    try {
      await api.albumApi.removeUserFromAlbum({ id: album.id, userId });
      dispatch('remove', userId);
      const message = userId === 'me' ? `Left ${album.albumName}` : `Removed ${selectedRemoveUser.name}`;
      notificationController.show({ type: NotificationType.Info, message });
    } catch (error) {
      handleError(error, 'Unable to remove user');
    } finally {
      selectedRemoveUser = null;
    }
  };
</script>

{#if !selectedRemoveUser}
  <BaseModal on:close={() => dispatch('close')}>
    <svelte:fragment slot="title">
      <span class="flex place-items-center gap-2">
        <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Options</p>
      </span>
    </svelte:fragment>

    <section class="immich-scrollbar max-h-[400px] overflow-y-auto pb-4">
      <div class="flex w-full place-items-center justify-between gap-4 p-5">
        <div class="flex place-items-center gap-4">
          <UserAvatar user={album.owner} size="md" />
          <p class="text-sm font-medium">{album.owner.name}</p>
        </div>

        <div id="icon-{album.owner.id}" class="flex place-items-center">
          <p class="text-sm">Owner</p>
        </div>
      </div>
      {#each album.sharedUsers as user}
        <div
          class="flex w-full place-items-center justify-between gap-4 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex place-items-center gap-4">
            <UserAvatar {user} size="md" />
            <p class="text-sm font-medium">{user.name}</p>
          </div>

          <div id="icon-{user.id}" class="flex place-items-center">
            {#if isOwned}
              <div>
                <CircleIconButton
                  on:click={(event) => showContextMenu(event, user)}
                  icon={mdiDotsVertical}
                  backgroundColor="transparent"
                  hoverColor="#e2e7e9"
                  size="20"
                />

                {#if selectedMenuUser === user}
                  <ContextMenu {...position} on:outclick={() => (selectedMenuUser = null)}>
                    <MenuOption on:click={handleMenuRemove} text="Remove" />
                  </ContextMenu>
                {/if}
              </div>
            {:else if user.id == currentUser?.id}
              <button
                on:click={() => (selectedRemoveUser = user)}
                class="text-sm font-medium text-immich-primary transition-colors hover:text-immich-primary/75 dark:text-immich-dark-primary"
                >Leave</button
              >
            {/if}
          </div>
        </div>
      {/each}
    </section>
  </BaseModal>
{/if}

{#if selectedRemoveUser && selectedRemoveUser?.id === currentUser?.id}
  <ConfirmDialogue
    title="Leave Album?"
    prompt="Are you sure you want to leave {album.albumName}?"
    confirmText="Leave"
    on:confirm={handleRemoveUser}
    on:cancel={() => (selectedRemoveUser = null)}
  />
{/if}

{#if selectedRemoveUser && selectedRemoveUser?.id !== currentUser?.id}
  <ConfirmDialogue
    title="Remove User?"
    prompt="Are you sure you want to remove {selectedRemoveUser.name}"
    confirmText="Remove"
    on:confirm={handleRemoveUser}
    on:cancel={() => (selectedRemoveUser = null)}
  />
{/if}
