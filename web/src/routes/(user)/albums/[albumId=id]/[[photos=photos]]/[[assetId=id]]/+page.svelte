<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import AlbumDescription from '$lib/components/album-page/album-description.svelte';
  import AlbumOptions from '$lib/components/album-page/album-options.svelte';
  import AlbumSummary from '$lib/components/album-page/album-summary.svelte';
  import AlbumTitle from '$lib/components/album-page/album-title.svelte';
  import ShareInfoModal from '$lib/components/album-page/share-info-modal.svelte';
  import UserSelectionModal from '$lib/components/album-page/user-selection-modal.svelte';
  import ActivityStatus from '$lib/components/asset-viewer/activity-status.svelte';
  import ActivityViewer from '$lib/components/asset-viewer/activity-viewer.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
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
  import { AppRoute } from '$lib/constants';
  import { numberOfComments, setNumberOfComments, updateNumberOfComments } from '$lib/stores/activity.store';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { user } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { downloadAlbum } from '$lib/utils/asset-utils';
  import { clickOutside } from '$lib/utils/click-outside';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import { isAlbumsRoute, isPeopleRoute, isSearchRoute } from '$lib/utils/navigation';
  import {
    AlbumUserRole,
    AssetOrder,
    ReactionLevel,
    ReactionType,
    addAssetsToAlbum,
    addUsersToAlbum,
    createActivity,
    deleteActivity,
    deleteAlbum,
    getActivities,
    getActivityStatistics,
    getAlbumInfo,
    updateAlbumInfo,
    type ActivityResponseDto,
    type AlbumUserAddDto,
  } from '@immich/sdk';
  import {
    mdiArrowLeft,
    mdiCogOutline,
    mdiDeleteOutline,
    mdiDotsVertical,
    mdiFolderDownloadOutline,
    mdiImageOutline,
    mdiImagePlusOutline,
    mdiLink,
    mdiPlus,
    mdiPresentationPlay,
    mdiShareVariantOutline,
  } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import type { PageData } from './$types';

  export let data: PageData;

  let { isViewing: showAssetViewer, setAsset } = assetViewingStore;
  let { slideshowState, slideshowNavigation } = slideshowStore;

  $: album = data.album;
  $: albumId = album.id;
  $: albumKey = `${albumId}_${albumOrder}`;

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
  let isCreatingSharedAlbum = false;
  let contextMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
  let isShowActivity = false;
  let isLiked: ActivityResponseDto | null = null;
  let reactions: ActivityResponseDto[] = [];
  let globalWidth: number;
  let assetGridWidth: number;
  let albumOrder: AssetOrder | undefined = data.album.order;

  $: assetStore = new AssetStore({ albumId, order: albumOrder });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: timelineStore = new AssetStore({ isArchived: false }, albumId);
  const timelineInteractionStore = createAssetInteractionStore();
  const { selectedAssets: timelineSelected } = timelineInteractionStore;

  $: isOwned = $user.id == album.ownerId;
  $: isAllUserOwned = [...$selectedAssets].every((asset) => asset.ownerId === $user.id);
  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);
  $: isAllArchived = [...$selectedAssets].every((asset) => asset.isArchived);
  $: {
    assetGridWidth = isShowActivity ? globalWidth - (globalWidth < 768 ? 360 : 460) : globalWidth;
  }
  $: showActivityStatus =
    album.sharedUsers.length > 0 && !$showAssetViewer && (album.isActivityEnabled || $numberOfComments > 0);

  $: isEditor =
    album.albumUsers.find(({ user: { id } }) => id === $user.id)?.role === AlbumUserRole.Editor ||
    album.ownerId === $user.id;

  $: albumHasViewers = album.albumUsers.some(({ role }) => role === AlbumUserRole.Viewer);

  afterNavigate(({ from }) => {
    let url: string | undefined = from?.url?.pathname;

    const route = from?.route?.id;
    if (isSearchRoute(route)) {
      url = from?.url.href;
    }

    if (isAlbumsRoute(route) || isPeopleRoute(route)) {
      url = AppRoute.ALBUMS;
    }

    backUrl = url || AppRoute.ALBUMS;

    if (backUrl === AppRoute.SHARING && album.sharedUsers.length === 0 && !album.hasSharedLink) {
      isCreatingSharedAlbum = true;
    }
  });

  const handleToggleEnableActivity = async () => {
    try {
      album = await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          isActivityEnabled: !album.isActivityEnabled,
        },
      });
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
        await deleteActivity({ id: activityId });
        reactions = reactions.filter((reaction) => reaction.id !== activityId);
        isLiked = null;
      } else {
        isLiked = await createActivity({
          activityCreateDto: { albumId: album.id, type: ReactionType.Like },
        });
        reactions = [...reactions, isLiked];
      }
    } catch (error) {
      handleError(error, "Can't change favorite for asset");
    }
  };

  const getFavorite = async () => {
    if ($user) {
      try {
        const data = await getActivities({
          userId: $user.id,
          albumId: album.id,
          $type: ReactionType.Like,
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
      const { comments } = await getActivityStatistics({ albumId: album.id });
      setNumberOfComments(comments);
    } catch (error) {
      handleError(error, "Can't get number of comments");
    }
  };

  const handleOpenAndCloseActivityTab = () => {
    isShowActivity = !isShowActivity;
  };

  $: if (album.sharedUsers.length > 0) {
    handlePromiseError(getFavorite());
    handlePromiseError(getNumberOfComments());
  }

  const handleStartSlideshow = async () => {
    const asset =
      $slideshowNavigation === SlideshowNavigation.Shuffle ? await assetStore.getRandomAsset() : assetStore.assets[0];
    if (asset) {
      setAsset(asset);
      $slideshowState = SlideshowState.PlaySlideshow;
    }
  };

  const handleEscape = async () => {
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
    await goto(backUrl);
    return;
  };

  const refreshAlbum = async () => {
    album = await getAlbumInfo({ id: album.id, withoutAssets: true });
  };

  const handleAddAssets = async () => {
    const assetIds = [...$timelineSelected].map((asset) => asset.id);

    try {
      const results = await addAssetsToAlbum({
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

  const handleAddUsers = async (albumUsers: AlbumUserAddDto[]) => {
    try {
      album = await addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          albumUsers,
        },
      });

      viewMode = ViewMode.VIEW;
    } catch (error) {
      handleError(error, 'Error adding users to album');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (userId == 'me' || userId === $user.id) {
      await goto(backUrl);
      return;
    }

    try {
      await refreshAlbum();
      viewMode = album.sharedUsers.length > 0 ? ViewMode.VIEW_USERS : ViewMode.VIEW;
    } catch (error) {
      handleError(error, 'Error deleting shared user');
    }
  };

  const handleDownloadAlbum = async () => {
    await downloadAlbum(album);
  };

  const handleRemoveAlbum = async () => {
    try {
      await deleteAlbum({ id: album.id });
      await goto(backUrl);
    } catch (error) {
      handleError(error, 'Unable to delete album');
    } finally {
      viewMode = ViewMode.VIEW;
    }
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    assetStore.removeAssets(assetIds);
    await refreshAlbum();
  };

  const handleUpdateThumbnail = async (assetId: string) => {
    if (viewMode !== ViewMode.SELECT_THUMBNAIL) {
      return;
    }

    viewMode = ViewMode.VIEW;
    assetInteractionStore.clearMultiselect();

    await updateThumbnail(assetId);
  };

  const updateThumbnailUsingCurrentSelection = async () => {
    if ($selectedAssets.size === 1) {
      const assetId = [...$selectedAssets][0].id;
      assetInteractionStore.clearMultiselect();
      await updateThumbnail(assetId);
    }
  };

  const updateThumbnail = async (assetId: string) => {
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumThumbnailAssetId: assetId,
        },
      });
    } catch (error) {
      handleError(error, 'Unable to update album cover');
    }
  };
</script>

<div class="flex overflow-hidden" bind:clientWidth={globalWidth}>
  <div class="relative w-full shrink">
    {#if $isMultiSelectState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
        <CreateSharedLink />
        <SelectAllAssets {assetStore} {assetInteractionStore} />
        <AssetSelectContextMenu icon={mdiPlus} title="Add to...">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        {#if isAllUserOwned}
          <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
        {/if}
        <AssetSelectContextMenu icon={mdiDotsVertical} title="Menu">
          <DownloadAction menuItem filename="{album.albumName}.zip" />
          {#if isAllUserOwned}
            <ChangeDate menuItem />
            <ChangeLocation menuItem />
            {#if $selectedAssets.size === 1}
              <MenuOption
                text="Set as album cover"
                icon={mdiImageOutline}
                on:click={() => updateThumbnailUsingCurrentSelection()}
              />
            {/if}
            <ArchiveAction menuItem unarchive={isAllArchived} onArchive={() => assetStore.triggerUpdate()} />
          {/if}
          {#if isOwned || isAllUserOwned}
            <RemoveFromAlbum menuItem bind:album onRemove={handleRemoveAssets} />
          {/if}
          {#if isAllUserOwned}
            <DeleteAssets menuItem onAssetDelete={handleRemoveAssets} />
          {/if}
        </AssetSelectContextMenu>
      </AssetSelectControlBar>
    {:else}
      {#if viewMode === ViewMode.VIEW || viewMode === ViewMode.ALBUM_OPTIONS}
        <ControlAppBar showBackButton backIcon={mdiArrowLeft} on:close={() => goto(backUrl)}>
          <svelte:fragment slot="trailing">
            {#if isEditor}
              <CircleIconButton
                title="Add photos"
                on:click={() => (viewMode = ViewMode.SELECT_ASSETS)}
                icon={mdiImagePlusOutline}
              />
            {/if}

            {#if isOwned}
              <CircleIconButton
                title="Share"
                on:click={() => (viewMode = ViewMode.SELECT_USERS)}
                icon={mdiShareVariantOutline}
              />
            {/if}

            {#if album.assetCount > 0}
              <CircleIconButton title="Slideshow" on:click={handleStartSlideshow} icon={mdiPresentationPlay} />
              <CircleIconButton title="Download" on:click={handleDownloadAlbum} icon={mdiFolderDownloadOutline} />

              {#if isOwned}
                <div use:clickOutside on:outclick={() => (viewMode = ViewMode.VIEW)}>
                  <CircleIconButton title="Album options" on:click={handleOpenAlbumOptions} icon={mdiDotsVertical} />
                  {#if viewMode === ViewMode.ALBUM_OPTIONS}
                    <ContextMenu {...contextMenuPosition}>
                      <MenuOption
                        icon={mdiImageOutline}
                        text="Select album cover"
                        on:click={() => (viewMode = ViewMode.SELECT_THUMBNAIL)}
                      />
                      <MenuOption icon={mdiCogOutline} text="Options" on:click={() => (viewMode = ViewMode.OPTIONS)} />
                      <MenuOption
                        icon={mdiDeleteOutline}
                        text="Delete album"
                        on:click={() => (viewMode = ViewMode.CONFIRM_DELETE)}
                      />
                    </ContextMenu>
                  {/if}
                </div>
              {/if}
            {/if}

            {#if isCreatingSharedAlbum && album.sharedUsers.length === 0}
              <Button
                size="sm"
                rounded="lg"
                disabled={album.assetCount === 0}
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
      <!-- Use key because AssetGrid can't deal with changing stores -->
      {#key albumKey}
        {#if viewMode === ViewMode.SELECT_ASSETS}
          <AssetGrid
            assetStore={timelineStore}
            assetInteractionStore={timelineInteractionStore}
            isSelectionMode={true}
          />
        {:else}
          <AssetGrid
            {album}
            {assetStore}
            {assetInteractionStore}
            isShared={album.sharedUsers.length > 0}
            isSelectionMode={viewMode === ViewMode.SELECT_THUMBNAIL}
            singleSelect={viewMode === ViewMode.SELECT_THUMBNAIL}
            showArchiveIcon
            on:select={({ detail: asset }) => handleUpdateThumbnail(asset.id)}
            on:escape={handleEscape}
          >
            {#if viewMode !== ViewMode.SELECT_THUMBNAIL}
              <!-- ALBUM TITLE -->
              <section class="pt-24">
                <AlbumTitle id={album.id} albumName={album.albumName} {isOwned} />

                {#if album.assetCount > 0}
                  <AlbumSummary {album} />
                {/if}

                <!-- ALBUM SHARING -->
                {#if album.sharedUsers.length > 0 || (album.hasSharedLink && isOwned)}
                  <div class="my-3 flex gap-x-1">
                    <!-- link -->
                    {#if album.hasSharedLink && isOwned}
                      <CircleIconButton
                        title="Create link to share"
                        color="gray"
                        size="20"
                        icon={mdiLink}
                        on:click={() => (viewMode = ViewMode.LINK_SHARING)}
                      />
                    {/if}

                    <!-- owner -->
                    <button on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                      <UserAvatar user={album.owner} size="md" />
                    </button>

                    <!-- users with write access (collaborators) -->
                    {#each album.albumUsers.filter(({ role }) => role === AlbumUserRole.Editor) as { user } (user.id)}
                      <button on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                        <UserAvatar {user} size="md" />
                      </button>
                    {/each}

                    <!-- display ellipsis if there are readonly users too -->
                    {#if albumHasViewers}
                      <CircleIconButton
                        title="View all users"
                        color="gray"
                        size="20"
                        icon={mdiDotsVertical}
                        on:click={() => (viewMode = ViewMode.VIEW_USERS)}
                      />
                    {/if}

                    {#if isOwned}
                      <CircleIconButton
                        color="gray"
                        size="20"
                        icon={mdiPlus}
                        on:click={() => (viewMode = ViewMode.SELECT_USERS)}
                        title="Add more users"
                      />
                    {/if}
                  </div>
                {/if}
                <!-- ALBUM DESCRIPTION -->
                <AlbumDescription id={album.id} description={album.description} {isOwned} />
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
      {/key}
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
    onClose={() => (viewMode = ViewMode.VIEW)}
  />
{/if}

{#if viewMode === ViewMode.LINK_SHARING}
  <CreateSharedLinkModal albumId={album.id} onClose={() => (viewMode = ViewMode.VIEW)} />
{/if}

{#if viewMode === ViewMode.VIEW_USERS}
  <ShareInfoModal
    onClose={() => (viewMode = ViewMode.VIEW)}
    {album}
    on:remove={({ detail: userId }) => handleRemoveUser(userId)}
    on:refreshAlbum={refreshAlbum}
  />
{/if}

{#if viewMode === ViewMode.CONFIRM_DELETE}
  <ConfirmDialogue
    id="delete-album-modal"
    title="Delete album"
    confirmText="Delete"
    onConfirm={handleRemoveAlbum}
    onClose={() => (viewMode = ViewMode.VIEW)}
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
    order={albumOrder}
    user={$user}
    onChangeOrder={(order) => (albumOrder = order)}
    on:close={() => (viewMode = ViewMode.VIEW)}
    on:toggleEnableActivity={handleToggleEnableActivity}
    on:showSelectSharedUser={() => (viewMode = ViewMode.SELECT_USERS)}
  />
{/if}

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
