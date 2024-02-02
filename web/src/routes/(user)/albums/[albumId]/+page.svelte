<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import ShareInfoModal from '$lib/components/album-page/share-info-modal.svelte';
  import UserSelectionModal from '$lib/components/album-page/user-selection-modal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import RemoveFromAlbum from '$lib/components/photos-page/actions/remove-from-album.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { AppRoute, dateFormats } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';
  import { downloadArchive } from '$lib/utils/asset-utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import { type ActivityResponseDto, ReactionLevel, ReactionType, type UserResponseDto, api } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { PageData } from './$types';
  import { clickOutside } from '$lib/utils/click-outside';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import {
    mdiPlus,
    mdiDotsVertical,
    mdiArrowLeft,
    mdiFileImagePlusOutline,
    mdiFolderDownloadOutline,
    mdiLink,
    mdiShareVariantOutline,
    mdiDeleteOutline,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import ActivityViewer from '$lib/components/asset-viewer/activity-viewer.svelte';
  import ActivityStatus from '$lib/components/asset-viewer/activity-status.svelte';
  import { numberOfComments, setNumberOfComments, updateNumberOfComments } from '$lib/stores/activity.store';
  import AlbumOptions from '$lib/components/album-page/album-options.svelte';
  import UpdatePanel from '$lib/components/shared-components/update-panel.svelte';
  import { user } from '$lib/stores/user.store';
  import { autoGrowHeight } from '$lib/utils/autogrow';

  export let data: PageData;

  let { isViewing: showAssetViewer, setAssetId } = assetViewingStore;
  let { slideshowState, slideshowShuffle } = slideshowStore;

  let album = data.album;
  let description = album.description;

  $: album = data.album;

  $: {
    if (!album.isActivityEnabled && $numberOfComments === 0) {
      isShowActivity = false;
    }
  }

  enum ViewMode {
    CONFIRM_DELETE = 'confirm-delete',
    LINK_SHARING = 'link-sharing',
    SELECT_USERS = 'select-users',
    SELECT_THUMBNAIL = 'select-thumbnail',
    SELECT_ASSETS = 'select-assets',
    ALBUM_OPTIONS = 'album-options',
    VIEW_USERS = 'view-users',
    VIEW = 'view',
    OPTIONS = 'options',
  }

  let backUrl: string = AppRoute.ALBUMS;
  let viewMode = ViewMode.VIEW;
  let titleInput: HTMLInputElement;
  let isCreatingSharedAlbum = false;
  let currentAlbumName = album.albumName;
  let contextMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
  let isShowActivity = false;
  let isLiked: ActivityResponseDto | null = null;
  let reactions: ActivityResponseDto[] = [];
  let globalWidth: number;
  let assetGridWidth: number;
  let textArea: HTMLTextAreaElement;

  const assetStore = new AssetStore({ albumId: album.id });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  const timelineStore = new AssetStore({ isArchived: false }, album.id);
  const timelineInteractionStore = createAssetInteractionStore();
  const { selectedAssets: timelineSelected } = timelineInteractionStore;

  $: isOwned = $user.id == album.ownerId;
  $: isAllUserOwned = [...$selectedAssets].every((asset) => asset.ownerId === $user.id);
  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);
  $: {
    assetGridWidth = isShowActivity ? globalWidth - (globalWidth < 768 ? 360 : 460) : globalWidth;
  }
  $: showActivityStatus =
    album.sharedUsers.length > 0 && !$showAssetViewer && (album.isActivityEnabled || $numberOfComments > 0);

  $: afterNavigate(({ from }) => {
    assetViewingStore.showAssetViewer(false);

    let url: string | undefined = from?.url?.pathname;

    if (from?.route.id === '/(user)/search') {
      url = from.url.href;
    }

    if (from?.route.id === '/(user)/albums/[albumId]' || from?.route.id === '/(user)/people/[personId]') {
      url = AppRoute.ALBUMS;
    }

    backUrl = url || AppRoute.ALBUMS;

    if (backUrl === AppRoute.SHARING && album.sharedUsers.length === 0) {
      isCreatingSharedAlbum = true;
    }
  });

  const handleToggleEnableActivity = async () => {
    try {
      const { data } = await api.albumApi.updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          isActivityEnabled: !album.isActivityEnabled,
        },
      });
      album = data;
      notificationController.show({
        type: NotificationType.Info,
        message: `Activity is ${album.isActivityEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      handleError(error, `Can't ${album.isActivityEnabled ? 'disable' : 'enable'} activity`);
    }
  };

  const handleFavorite = async () => {
    try {
      if (isLiked) {
        const activityId = isLiked.id;
        await api.activityApi.deleteActivity({ id: activityId });
        reactions = reactions.filter((reaction) => reaction.id !== activityId);
        isLiked = null;
      } else {
        const { data } = await api.activityApi.createActivity({
          activityCreateDto: { albumId: album.id, type: ReactionType.Like },
        });
        isLiked = data;
        reactions = [...reactions, isLiked];
      }
    } catch (error) {
      handleError(error, "Can't change favorite for asset");
    }
  };

  const getFavorite = async () => {
    if ($user) {
      try {
        const { data } = await api.activityApi.getActivities({
          userId: $user.id,
          albumId: album.id,
          type: ReactionType.Like,
          level: ReactionLevel.Album,
        });
        if (data.length > 0) {
          isLiked = data[0];
        }
      } catch (error) {
        handleError(error, "Can't get Favorite");
      }
    }
  };

  const getNumberOfComments = async () => {
    try {
      const { data } = await api.activityApi.getActivityStatistics({ albumId: album.id });
      setNumberOfComments(data.comments);
    } catch (error) {
      handleError(error, "Can't get number of comments");
    }
  };

  const handleOpenAndCloseActivityTab = () => {
    isShowActivity = !isShowActivity;
  };

  onMount(async () => {
    if (album.sharedUsers.length > 0) {
      getFavorite();
      getNumberOfComments();
    }
  });

  const handleKeypress = async (event: KeyboardEvent) => {
    if (event.target !== textArea) {
      return;
    }
    const ctrl = event.ctrlKey;
    switch (event.key) {
      case 'Enter': {
        if (ctrl && event.target === textArea) {
          textArea.blur();
        }
      }
    }
  };

  const handleStartSlideshow = async () => {
    const asset = $slideshowShuffle ? await assetStore.getRandomAsset() : assetStore.assets[0];
    if (asset) {
      setAssetId(asset.id);
      $slideshowState = SlideshowState.PlaySlideshow;
    }
  };

  const handleEscape = () => {
    if (viewMode === ViewMode.SELECT_USERS) {
      viewMode = ViewMode.VIEW;
      return;
    }
    if (viewMode === ViewMode.CONFIRM_DELETE) {
      viewMode = ViewMode.VIEW;
      return;
    }
    if (viewMode === ViewMode.SELECT_ASSETS) {
      handleCloseSelectAssets();
      return;
    }
    if (viewMode === ViewMode.LINK_SHARING) {
      viewMode = ViewMode.VIEW;
      return;
    }
    if (viewMode === ViewMode.OPTIONS) {
      viewMode = ViewMode.VIEW;
      return;
    }
    if ($showAssetViewer) {
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    }
    goto(backUrl);
    return;
  };

  const refreshAlbum = async () => {
    const { data } = await api.albumApi.getAlbumInfo({ id: album.id, withoutAssets: true });
    album = data;
  };

  const getDateRange = () => {
    const { startDate, endDate } = album;

    let start = '';
    let end = '';

    if (startDate) {
      start = new Date(startDate).toLocaleDateString($locale, dateFormats.album);
    }

    if (endDate) {
      end = new Date(endDate).toLocaleDateString($locale, dateFormats.album);
    }

    if (startDate && endDate && start !== end) {
      return `${start} - ${end}`;
    }

    if (start) {
      return start;
    }

    return '';
  };

  const handleAddAssets = async () => {
    const assetIds = [...$timelineSelected].map((asset) => asset.id);

    try {
      const { data: results } = await api.albumApi.addAssetsToAlbum({
        id: album.id,
        bulkIdsDto: { ids: assetIds },
      });

      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: `Added ${count} asset${count === 1 ? '' : 's'}`,
      });

      await refreshAlbum();

      timelineInteractionStore.clearMultiselect();
      viewMode = ViewMode.VIEW;
    } catch (error) {
      handleError(error, 'Error adding assets to album');
    }
  };

  const handleRemoveAssets = (assetIds: string[]) => {
    for (const assetId of assetIds) {
      assetStore.removeAsset(assetId);
    }
  };

  const handleCloseSelectAssets = () => {
    viewMode = ViewMode.VIEW;
    timelineInteractionStore.clearMultiselect();
  };

  const handleOpenAlbumOptions = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-left');
    viewMode = viewMode === ViewMode.VIEW ? ViewMode.ALBUM_OPTIONS : ViewMode.VIEW;
  };

  const handleSelectFromComputer = async () => {
    await openFileUploadDialog(album.id);
    timelineInteractionStore.clearMultiselect();
    viewMode = ViewMode.VIEW;
  };

  const handleAddUsers = async (users: UserResponseDto[]) => {
    try {
      const { data } = await api.albumApi.addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          sharedUserIds: [...users].map(({ id }) => id),
        },
      });

      album = data;

      viewMode = ViewMode.VIEW;
    } catch (error) {
      handleError(error, 'Error adding users to album');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (userId == 'me' || userId === $user.id) {
      goto(backUrl);
      return;
    }

    try {
      await refreshAlbum();
      viewMode = album.sharedUsers.length > 1 ? ViewMode.SELECT_USERS : ViewMode.VIEW;
    } catch (error) {
      handleError(error, 'Error deleting share users');
    }
  };

  const handleDownloadAlbum = async () => {
    await downloadArchive(`${album.albumName}.zip`, { albumId: album.id });
  };

  const handleRemoveAlbum = async () => {
    try {
      await api.albumApi.deleteAlbum({ id: album.id });
      goto(backUrl);
    } catch (error) {
      handleError(error, 'Unable to delete album');
    } finally {
      viewMode = ViewMode.VIEW;
    }
  };

  const handleUpdateThumbnail = async (assetId: string) => {
    if (viewMode !== ViewMode.SELECT_THUMBNAIL) {
      return;
    }

    viewMode = ViewMode.VIEW;
    assetInteractionStore.clearMultiselect();

    try {
      await api.albumApi.updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumThumbnailAssetId: assetId,
        },
      });

      notificationController.show({ type: NotificationType.Info, message: 'Updated album cover' });
    } catch (error) {
      handleError(error, 'Unable to update album cover');
    }
  };

  const handleUpdateName = async () => {
    if (currentAlbumName === album.albumName) {
      return;
    }

    try {
      await api.albumApi.updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumName: album.albumName,
        },
      });
      currentAlbumName = album.albumName;
      notificationController.show({ type: NotificationType.Info, message: 'New album name has been saved' });
    } catch (error) {
      handleError(error, 'Unable to update album name');
    }
  };

  const handleUpdateDescription = async () => {
    if (album.description === description) {
      return;
    }
    try {
      await api.albumApi.updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          description,
        },
      });

      album.description = description;
    } catch (error) {
      handleError(error, 'Error updating album description');
    }
  };
</script>

<svelte:window on:keydown={handleKeypress} />

<div class="flex overflow-hidden" bind:clientWidth={globalWidth}>
  <div class="relative w-full shrink">
    {#if $isMultiSelectState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
        <CreateSharedLink />
        <SelectAllAssets {assetStore} {assetInteractionStore} />
        <AssetSelectContextMenu icon={mdiPlus} title="Add">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        <AssetSelectContextMenu icon={mdiDotsVertical} title="Menu">
          {#if isAllUserOwned}
            <FavoriteAction menuItem removeFavorite={isAllFavorite} />
          {/if}
          <ArchiveAction menuItem />
          <DownloadAction menuItem filename="{album.albumName}.zip" />
          {#if isOwned || isAllUserOwned}
            <RemoveFromAlbum menuItem bind:album onRemove={(assetIds) => handleRemoveAssets(assetIds)} />
          {/if}
          {#if isAllUserOwned}
            <DeleteAssets menuItem onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
            <ChangeDate menuItem />
            <ChangeLocation menuItem />
          {/if}
        </AssetSelectContextMenu>
      </AssetSelectControlBar>
    {:else}
      {#if viewMode === ViewMode.VIEW || viewMode === ViewMode.ALBUM_OPTIONS}
        <ControlAppBar showBackButton backIcon={mdiArrowLeft} on:close={() => goto(backUrl)}>
          <svelte:fragment slot="trailing">
            <CircleIconButton
              title="Add Photos"
              on:click={() => (viewMode = ViewMode.SELECT_ASSETS)}
              icon={mdiFileImagePlusOutline}
            />

            {#if isOwned}
              <CircleIconButton
                title="Share"
                on:click={() => (viewMode = ViewMode.SELECT_USERS)}
                icon={mdiShareVariantOutline}
              />
              <CircleIconButton
                title="Delete album"
                on:click={() => (viewMode = ViewMode.CONFIRM_DELETE)}
                icon={mdiDeleteOutline}
              />
            {/if}

            {#if album.assetCount > 0}
              <CircleIconButton title="Download" on:click={handleDownloadAlbum} icon={mdiFolderDownloadOutline} />

              {#if isOwned}
                <div use:clickOutside on:outclick={() => (viewMode = ViewMode.VIEW)}>
                  <CircleIconButton title="Album options" on:click={handleOpenAlbumOptions} icon={mdiDotsVertical}>
                    {#if viewMode === ViewMode.ALBUM_OPTIONS}
                      <ContextMenu {...contextMenuPosition}>
                        {#if album.assetCount !== 0}
                          <MenuOption on:click={handleStartSlideshow} text="Slideshow" />
                        {/if}
                        <MenuOption on:click={() => (viewMode = ViewMode.SELECT_THUMBNAIL)} text="Set album cover" />
                        <MenuOption on:click={() => (viewMode = ViewMode.OPTIONS)} text="Options" />
                      </ContextMenu>
                    {/if}
                  </CircleIconButton>
                </div>
              {/if}
            {/if}

            {#if isCreatingSharedAlbum && album.sharedUsers.length === 0}
              <Button
                size="sm"
                rounded="lg"
                disabled={album.assetCount == 0}
                on:click={() => (viewMode = ViewMode.SELECT_USERS)}
              >
                Share
              </Button>
            {/if}
          </svelte:fragment>
        </ControlAppBar>
      {/if}

      {#if viewMode === ViewMode.SELECT_ASSETS}
        <ControlAppBar on:close={handleCloseSelectAssets}>
          <svelte:fragment slot="leading">
            <p class="text-lg dark:text-immich-dark-fg">
              {#if $timelineSelected.size === 0}
                Add to album
              {:else}
                {$timelineSelected.size.toLocaleString($locale)} selected
              {/if}
            </p>
          </svelte:fragment>

          <svelte:fragment slot="trailing">
            <button
              on:click={handleSelectFromComputer}
              class="rounded-lg px-6 py-2 text-sm font-medium text-immich-primary transition-all hover:bg-immich-primary/10 dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/25"
            >
              Select from computer
            </button>
            <Button size="sm" rounded="lg" disabled={$timelineSelected.size === 0} on:click={handleAddAssets}
              >Done</Button
            >
          </svelte:fragment>
        </ControlAppBar>
      {/if}

      {#if viewMode === ViewMode.SELECT_THUMBNAIL}
        <ControlAppBar on:close={() => (viewMode = ViewMode.VIEW)}>
          <svelte:fragment slot="leading">Select Album Cover</svelte:fragment>
        </ControlAppBar>
      {/if}
    {/if}

    <main
      class="relative h-screen overflow-hidden bg-immich-bg px-6 pt-[var(--navbar-height)] dark:bg-immich-dark-bg"
      style={`width:${assetGridWidth}px`}
    >
      {#if viewMode === ViewMode.SELECT_ASSETS}
        <AssetGrid assetStore={timelineStore} assetInteractionStore={timelineInteractionStore} isSelectionMode={true} />
      {:else}
        <AssetGrid
          {album}
          {assetStore}
          {assetInteractionStore}
          isShared={album.sharedUsers.length > 0}
          isSelectionMode={viewMode === ViewMode.SELECT_THUMBNAIL}
          singleSelect={viewMode === ViewMode.SELECT_THUMBNAIL}
          on:select={({ detail: asset }) => handleUpdateThumbnail(asset.id)}
          on:escape={handleEscape}
        >
          {#if viewMode !== ViewMode.SELECT_THUMBNAIL}
            <!-- ALBUM TITLE -->
            <section class="pt-24">
              <input
                on:keydown={(e) => e.key === 'Enter' && titleInput.blur()}
                on:blur={handleUpdateName}
                class="w-[99%] border-b-2 border-transparent text-6xl text-immich-primary outline-none transition-all dark:text-immich-dark-primary {isOwned
                  ? 'hover:border-gray-400'
                  : 'hover:border-transparent'} bg-immich-bg focus:border-b-2 focus:border-immich-primary focus:outline-none dark:bg-immich-dark-bg dark:focus:border-immich-dark-primary dark:focus:bg-immich-dark-gray"
                type="text"
                bind:value={album.albumName}
                disabled={!isOwned}
                bind:this={titleInput}
                title="Edit Title"
                placeholder="Add a title"
              />

              <!-- ALBUM SUMMARY -->
              {#if album.assetCount > 0}
                <span class="my-4 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
                  <p class="">{getDateRange()}</p>
                  <p>·</p>
                  <p>{album.assetCount} items</p>
                </span>
              {/if}

              <!-- ALBUM SHARING -->
              {#if album.sharedUsers.length > 0 || (album.hasSharedLink && isOwned)}
                <div class="my-6 flex gap-x-1">
                  <!-- link -->
                  {#if album.hasSharedLink && isOwned}
                    <CircleIconButton
                      backgroundColor="#d3d3d3"
                      forceDark
                      size="20"
                      icon={mdiLink}
                      on:click={() => (viewMode = ViewMode.LINK_SHARING)}
                    />
                  {/if}

                  <!-- owner -->
                  <button on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                    <UserAvatar user={album.owner} size="md" />
                  </button>

                  <!-- users -->
                  {#each album.sharedUsers as user (user.id)}
                    <button on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                      <UserAvatar {user} size="md" />
                    </button>
                  {/each}

                  {#if isOwned}
                    <CircleIconButton
                      backgroundColor="#d3d3d3"
                      forceDark
                      size="20"
                      icon={mdiPlus}
                      on:click={() => (viewMode = ViewMode.SELECT_USERS)}
                      title="Add more users"
                    />
                  {/if}
                </div>
              {/if}
              <!-- ALBUM DESCRIPTION -->
              {#if isOwned}
                <textarea
                  class="w-full resize-none overflow-hidden text-black dark:text-white border-b-2 border-transparent border-gray-500 bg-transparent text-base outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:focus:border-immich-dark-primary hover:border-gray-400"
                  bind:this={textArea}
                  bind:value={description}
                  on:input={() => autoGrowHeight(textArea)}
                  on:focusout={handleUpdateDescription}
                  use:autoGrowHeight
                  placeholder="Add description"
                />
              {:else if description}
                <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
              {/if}
            </section>
          {/if}

          {#if album.assetCount === 0}
            <section id="empty-album" class=" mt-[200px] flex place-content-center place-items-center">
              <div class="w-[300px]">
                <p class="text-xs dark:text-immich-dark-fg">ADD PHOTOS</p>
                <button
                  on:click={() => (viewMode = ViewMode.SELECT_ASSETS)}
                  class="mt-5 flex w-full place-items-center gap-6 rounded-md border bg-immich-bg px-8 py-8 text-immich-fg transition-all hover:bg-gray-100 hover:text-immich-primary dark:border-none dark:bg-immich-dark-gray dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
                >
                  <span class="text-text-immich-primary dark:text-immich-dark-primary"
                    ><Icon path={mdiPlus} size="24" />
                  </span>
                  <span class="text-lg">Select photos</span>
                </button>
              </div>
            </section>
          {/if}
        </AssetGrid>
      {/if}

      {#if showActivityStatus}
        <div class="absolute z-[2] bottom-0 right-0 mb-6 mr-6 justify-self-end">
          <ActivityStatus
            disabled={!album.isActivityEnabled}
            {isLiked}
            numberOfComments={$numberOfComments}
            {isShowActivity}
            on:favorite={handleFavorite}
            on:openActivityTab={handleOpenAndCloseActivityTab}
          />
        </div>
      {/if}
    </main>
  </div>
  {#if album.sharedUsers.length > 0 && album && isShowActivity && $user && !$showAssetViewer}
    <div class="flex">
      <div
        transition:fly={{ duration: 150 }}
        id="activity-panel"
        class="z-[2] w-[360px] md:w-[460px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-l-immich-dark-gray dark:bg-immich-dark-bg"
        translate="yes"
      >
        <ActivityViewer
          user={$user}
          disabled={!album.isActivityEnabled}
          albumOwnerId={album.ownerId}
          albumId={album.id}
          {isLiked}
          bind:reactions
          on:addComment={() => updateNumberOfComments(1)}
          on:deleteComment={() => updateNumberOfComments(-1)}
          on:deleteLike={() => (isLiked = null)}
          on:close={handleOpenAndCloseActivityTab}
        />
      </div>
    </div>
  {/if}
</div>
{#if viewMode === ViewMode.SELECT_USERS}
  <UserSelectionModal
    {album}
    on:select={({ detail: users }) => handleAddUsers(users)}
    on:share={() => (viewMode = ViewMode.LINK_SHARING)}
    on:close={() => (viewMode = ViewMode.VIEW)}
  />
{/if}

{#if viewMode === ViewMode.LINK_SHARING}
  <CreateSharedLinkModal albumId={album.id} on:close={() => (viewMode = ViewMode.VIEW)} />
{/if}

{#if viewMode === ViewMode.VIEW_USERS}
  <ShareInfoModal
    on:close={() => (viewMode = ViewMode.VIEW)}
    {album}
    on:remove={({ detail: userId }) => handleRemoveUser(userId)}
  />
{/if}

{#if viewMode === ViewMode.CONFIRM_DELETE}
  <ConfirmDialogue
    title="Delete album"
    confirmText="Delete"
    on:confirm={handleRemoveAlbum}
    on:cancel={() => (viewMode = ViewMode.VIEW)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the album <b>{album.albumName}</b>?</p>
      <p>If this album is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}

{#if viewMode === ViewMode.OPTIONS && $user}
  <AlbumOptions
    {album}
    user={$user}
    on:close={() => (viewMode = ViewMode.VIEW)}
    on:toggleEnableActivity={handleToggleEnableActivity}
    on:showSelectSharedUser={() => (viewMode = ViewMode.SELECT_USERS)}
  />
{/if}

<UpdatePanel {assetStore} />

<style>
  ::placeholder {
    color: rgb(60, 60, 60);
    opacity: 0.6;
  }

  ::-ms-input-placeholder {
    /* Edge 12 -18 */
    color: white;
  }
</style>
