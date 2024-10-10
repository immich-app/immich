<script lang="ts">
  import { afterNavigate, goto, onNavigate } from '$app/navigation';
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
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
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
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { downloadAlbum } from '$lib/utils/asset-utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import {
    isAlbumsRoute,
    isPeopleRoute,
    isSearchRoute,
    navigate,
    type AssetGridRouteSearchParams,
  } from '$lib/utils/navigation';
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
  import { t } from 'svelte-i18n';
  import { onDestroy } from 'svelte';
  import { confirmAlbumDelete } from '$lib/utils/album-utils';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';

  export let data: PageData;

  let { isViewing: showAssetViewer, setAsset, gridScrollTarget } = assetViewingStore;
  let { slideshowState, slideshowNavigation } = slideshowStore;

  let oldAt: AssetGridRouteSearchParams | null | undefined;

  $: album = data.album;
  $: albumId = album.id;
  $: albumKey = `${albumId}_${albumOrder}`;

  $: {
    if (!album.isActivityEnabled && $numberOfComments === 0) {
      isShowActivity = false;
    }
  }

  enum ViewMode {
    LINK_SHARING = 'link-sharing',
    SELECT_USERS = 'select-users',
    SELECT_THUMBNAIL = 'select-thumbnail',
    SELECT_ASSETS = 'select-assets',
    VIEW_USERS = 'view-users',
    VIEW = 'view',
    OPTIONS = 'options',
  }

  let backUrl: string = AppRoute.ALBUMS;
  let viewMode = ViewMode.VIEW;
  let isCreatingSharedAlbum = false;
  let isShowActivity = false;
  let isLiked: ActivityResponseDto | null = null;
  let reactions: ActivityResponseDto[] = [];
  let globalWidth: number;
  let assetGridWidth: number;
  let albumOrder: AssetOrder | undefined = data.album.order;

  $: assetStore = new AssetStore({ albumId, order: albumOrder });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: timelineStore = new AssetStore({ isArchived: false, withPartners: true }, albumId);
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
    album.albumUsers.length > 0 && !$showAssetViewer && (album.isActivityEnabled || $numberOfComments > 0);

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

    if (backUrl === AppRoute.SHARING && album.albumUsers.length === 0 && !album.hasSharedLink) {
      isCreatingSharedAlbum = true;
    }
  });

  const handleToggleEnableActivity = async () => {
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          isActivityEnabled: !album.isActivityEnabled,
        },
      });
      await refreshAlbum();
      notificationController.show({
        type: NotificationType.Info,
        message: $t('activity_changed', { values: { enabled: album.isActivityEnabled } }),
      });
    } catch (error) {
      handleError(error, $t('errors.cant_change_activity', { values: { enabled: album.isActivityEnabled } }));
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
      handleError(error, $t('errors.cant_change_asset_favorite'));
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
        handleError(error, $t('errors.unable_to_load_liked_status'));
      }
    }
  };

  const getNumberOfComments = async () => {
    try {
      const { comments } = await getActivityStatistics({ albumId: album.id });
      setNumberOfComments(comments);
    } catch (error) {
      handleError(error, $t('errors.cant_get_number_of_comments'));
    }
  };

  const handleOpenAndCloseActivityTab = () => {
    isShowActivity = !isShowActivity;
  };

  $: if (album.albumUsers.length > 0) {
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

    if (viewMode === ViewMode.SELECT_ASSETS) {
      await handleCloseSelectAssets();
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
    data.album = await getAlbumInfo({ id: album.id, withoutAssets: true });
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
        message: $t('assets_added_count', { values: { count } }),
      });

      await refreshAlbum();

      timelineInteractionStore.clearMultiselect();
      await setModeToView();
    } catch (error) {
      handleError(error, $t('errors.error_adding_assets_to_album'));
    }
  };

  const setModeToView = async () => {
    viewMode = ViewMode.VIEW;
    assetStore.destroy();
    assetStore = new AssetStore({ albumId, order: albumOrder });
    timelineStore.destroy();
    timelineStore = new AssetStore({ isArchived: false }, albumId);
    await navigate(
      { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: { at: oldAt?.at } },
      { replaceState: true, forceNavigate: true },
    );
    oldAt = null;
  };

  const handleCloseSelectAssets = async () => {
    timelineInteractionStore.clearMultiselect();
    await setModeToView();
  };

  const handleSelectFromComputer = async () => {
    await openFileUploadDialog({ albumId: album.id });
    timelineInteractionStore.clearMultiselect();
    await setModeToView();
  };

  const handleAddUsers = async (albumUsers: AlbumUserAddDto[]) => {
    try {
      await addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          albumUsers,
        },
      });
      await refreshAlbum();

      viewMode = ViewMode.VIEW;
    } catch (error) {
      handleError(error, $t('errors.error_adding_users_to_album'));
    }
  };

  const handleRemoveUser = async (userId: string, nextViewMode: ViewMode) => {
    if (userId == 'me' || userId === $user.id) {
      await goto(backUrl);
      return;
    }

    try {
      await refreshAlbum();

      // Dynamically set the view mode based on the passed argument
      viewMode = album.albumUsers.length > 0 ? nextViewMode : ViewMode.VIEW;
    } catch (error) {
      handleError(error, $t('errors.error_deleting_shared_user'));
    }
  };

  const handleDownloadAlbum = async () => {
    await downloadAlbum(album);
  };

  const handleRemoveAlbum = async () => {
    const isConfirmed = await confirmAlbumDelete(album);

    if (!isConfirmed) {
      viewMode = ViewMode.VIEW;
      return;
    }

    try {
      await deleteAlbum({ id: album.id });
      await goto(backUrl);
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_album'));
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
      handleError(error, $t('errors.unable_to_update_album_cover'));
    }
  };

  onNavigate(async ({ to }) => {
    if (!isAlbumsRoute(to?.route.id) && album.assetCount === 0 && !album.albumName) {
      await deleteAlbum(album);
    }
  });

  onDestroy(() => {
    assetStore.destroy();
    timelineStore.destroy();
  });
</script>

<div class="flex overflow-hidden" bind:clientWidth={globalWidth}>
  <div class="relative w-full shrink">
    {#if $isMultiSelectState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
        <CreateSharedLink />
        <SelectAllAssets {assetStore} {assetInteractionStore} />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>
        {#if isAllUserOwned}
          <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
        {/if}
        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem filename="{album.albumName}.zip" />
          {#if isAllUserOwned}
            <ChangeDate menuItem />
            <ChangeLocation menuItem />
            {#if $selectedAssets.size === 1}
              <MenuOption
                text={$t('set_as_album_cover')}
                icon={mdiImageOutline}
                onClick={() => updateThumbnailUsingCurrentSelection()}
              />
            {/if}
            <ArchiveAction menuItem unarchive={isAllArchived} onArchive={() => assetStore.triggerUpdate()} />
          {/if}

          {#if $preferences.tags.enabled && isAllUserOwned}
            <TagAction menuItem />
          {/if}

          {#if isOwned || isAllUserOwned}
            <RemoveFromAlbum menuItem bind:album onRemove={handleRemoveAssets} />
          {/if}
          {#if isAllUserOwned}
            <DeleteAssets menuItem onAssetDelete={handleRemoveAssets} />
          {/if}
        </ButtonContextMenu>
      </AssetSelectControlBar>
    {:else}
      {#if viewMode === ViewMode.VIEW}
        <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(backUrl)}>
          <svelte:fragment slot="trailing">
            {#if isEditor}
              <CircleIconButton
                title={$t('add_photos')}
                on:click={async () => {
                  viewMode = ViewMode.SELECT_ASSETS;
                  oldAt = { at: $gridScrollTarget?.at };
                  await navigate(
                    { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: { at: null } },
                    { replaceState: true },
                  );
                }}
                icon={mdiImagePlusOutline}
              />
            {/if}

            {#if isOwned}
              <CircleIconButton
                title={$t('share')}
                on:click={() => (viewMode = ViewMode.SELECT_USERS)}
                icon={mdiShareVariantOutline}
              />
            {/if}

            {#if album.assetCount > 0}
              <CircleIconButton title={$t('slideshow')} on:click={handleStartSlideshow} icon={mdiPresentationPlay} />
              <CircleIconButton title={$t('download')} on:click={handleDownloadAlbum} icon={mdiFolderDownloadOutline} />

              {#if isOwned}
                <ButtonContextMenu icon={mdiDotsVertical} title={$t('album_options')}>
                  <MenuOption
                    icon={mdiImageOutline}
                    text={$t('select_album_cover')}
                    onClick={() => (viewMode = ViewMode.SELECT_THUMBNAIL)}
                  />
                  <MenuOption icon={mdiCogOutline} text={$t('options')} onClick={() => (viewMode = ViewMode.OPTIONS)} />
                  <MenuOption icon={mdiDeleteOutline} text={$t('delete_album')} onClick={() => handleRemoveAlbum()} />
                </ButtonContextMenu>
              {/if}
            {/if}

            {#if isCreatingSharedAlbum && album.albumUsers.length === 0}
              <Button
                size="sm"
                rounded="lg"
                disabled={album.assetCount === 0}
                on:click={() => (viewMode = ViewMode.SELECT_USERS)}
              >
                {$t('share')}
              </Button>
            {/if}
          </svelte:fragment>
        </ControlAppBar>
      {/if}

      {#if viewMode === ViewMode.SELECT_ASSETS}
        <ControlAppBar onClose={handleCloseSelectAssets}>
          <svelte:fragment slot="leading">
            <p class="text-lg dark:text-immich-dark-fg">
              {#if $timelineSelected.size === 0}
                {$t('add_to_album')}
              {:else}
                {$t('selected_count', { values: { count: $timelineSelected.size } })}
              {/if}
            </p>
          </svelte:fragment>

          <svelte:fragment slot="trailing">
            <button
              type="button"
              on:click={handleSelectFromComputer}
              class="rounded-lg px-6 py-2 text-sm font-medium text-immich-primary transition-all hover:bg-immich-primary/10 dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/25"
            >
              {$t('select_from_computer')}
            </button>
            <Button size="sm" rounded="lg" disabled={$timelineSelected.size === 0} on:click={handleAddAssets}
              >{$t('done')}</Button
            >
          </svelte:fragment>
        </ControlAppBar>
      {/if}

      {#if viewMode === ViewMode.SELECT_THUMBNAIL}
        <ControlAppBar onClose={() => (viewMode = ViewMode.VIEW)}>
          <svelte:fragment slot="leading">{$t('select_album_cover')}</svelte:fragment>
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
            enableRouting={false}
            assetStore={timelineStore}
            assetInteractionStore={timelineInteractionStore}
            isSelectionMode={true}
          />
        {:else}
          <AssetGrid
            enableRouting={true}
            {album}
            {assetStore}
            {assetInteractionStore}
            isShared={album.albumUsers.length > 0}
            isSelectionMode={viewMode === ViewMode.SELECT_THUMBNAIL}
            singleSelect={viewMode === ViewMode.SELECT_THUMBNAIL}
            showArchiveIcon
            onSelect={({ id }) => handleUpdateThumbnail(id)}
            onEscape={handleEscape}
          >
            {#if viewMode !== ViewMode.SELECT_THUMBNAIL}
              <!-- ALBUM TITLE -->
              <section class="pt-8 md:pt-24">
                <AlbumTitle
                  id={album.id}
                  albumName={album.albumName}
                  {isOwned}
                  onUpdate={(albumName) => (album.albumName = albumName)}
                />

                {#if album.assetCount > 0}
                  <AlbumSummary {album} />
                {/if}

                <!-- ALBUM SHARING -->
                {#if album.albumUsers.length > 0 || (album.hasSharedLink && isOwned)}
                  <div class="my-3 flex gap-x-1">
                    <!-- link -->
                    {#if album.hasSharedLink && isOwned}
                      <CircleIconButton
                        title={$t('create_link_to_share')}
                        color="gray"
                        size="20"
                        icon={mdiLink}
                        on:click={() => (viewMode = ViewMode.LINK_SHARING)}
                      />
                    {/if}

                    <!-- owner -->
                    <button type="button" on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                      <UserAvatar user={album.owner} size="md" />
                    </button>

                    <!-- users with write access (collaborators) -->
                    {#each album.albumUsers.filter(({ role }) => role === AlbumUserRole.Editor) as { user } (user.id)}
                      <button type="button" on:click={() => (viewMode = ViewMode.VIEW_USERS)}>
                        <UserAvatar {user} size="md" />
                      </button>
                    {/each}

                    <!-- display ellipsis if there are readonly users too -->
                    {#if albumHasViewers}
                      <CircleIconButton
                        title={$t('view_all_users')}
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
                        title={$t('add_more_users')}
                      />
                    {/if}
                  </div>
                {/if}
                <!-- ALBUM DESCRIPTION -->
                <AlbumDescription id={album.id} bind:description={album.description} {isOwned} />
              </section>
            {/if}

            {#if album.assetCount === 0}
              <section id="empty-album" class=" mt-[200px] flex place-content-center place-items-center">
                <div class="w-[300px]">
                  <p class="text-xs dark:text-immich-dark-fg">{$t('add_photos').toUpperCase()}</p>
                  <button
                    type="button"
                    on:click={() => (viewMode = ViewMode.SELECT_ASSETS)}
                    class="mt-5 flex w-full place-items-center gap-6 rounded-md border bg-immich-bg px-8 py-8 text-immich-fg transition-all hover:bg-gray-100 hover:text-immich-primary dark:border-none dark:bg-immich-dark-gray dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
                  >
                    <span class="text-text-immich-primary dark:text-immich-dark-primary"
                      ><Icon path={mdiPlus} size="24" />
                    </span>
                    <span class="text-lg">{$t('select_photos')}</span>
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
              onFavorite={handleFavorite}
              onOpenActivityTab={handleOpenAndCloseActivityTab}
            />
          </div>
        {/if}
      {/key}
    </main>
  </div>
  {#if album.albumUsers.length > 0 && album && isShowActivity && $user && !$showAssetViewer}
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
          onAddComment={() => updateNumberOfComments(1)}
          onDeleteComment={() => updateNumberOfComments(-1)}
          onDeleteLike={() => (isLiked = null)}
          onClose={handleOpenAndCloseActivityTab}
        />
      </div>
    </div>
  {/if}
</div>
{#if viewMode === ViewMode.SELECT_USERS}
  <UserSelectionModal
    {album}
    onSelect={handleAddUsers}
    onShare={() => (viewMode = ViewMode.LINK_SHARING)}
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
    onRemove={(userId) => handleRemoveUser(userId, ViewMode.VIEW_USERS)}
    onRefreshAlbum={refreshAlbum}
  />
{/if}

{#if viewMode === ViewMode.OPTIONS && $user}
  <AlbumOptions
    {album}
    order={albumOrder}
    user={$user}
    onChangeOrder={async (order) => {
      albumOrder = order;
      await setModeToView();
    }}
    onRemove={(userId) => handleRemoveUser(userId, ViewMode.OPTIONS)}
    onClose={() => (viewMode = ViewMode.VIEW)}
    onToggleEnabledActivity={handleToggleEnableActivity}
    onShowSelectSharedUser={() => (viewMode = ViewMode.SELECT_USERS)}
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
