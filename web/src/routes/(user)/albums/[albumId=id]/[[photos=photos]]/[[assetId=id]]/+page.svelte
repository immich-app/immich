<script lang="ts">
  import { afterNavigate, goto, onNavigate } from '$app/navigation';
  import { scrollMemoryClearer } from '$lib/actions/scroll-memory';
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
  import { AppRoute, AlbumPageViewMode } from '$lib/constants';
  import { numberOfComments, setNumberOfComments, updateNumberOfComments } from '$lib/stores/activity.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets-store.svelte';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { downloadAlbum, cancelMultiselect } from '$lib/utils/asset-utils';
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
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let { isViewing: showAssetViewer, setAsset, gridScrollTarget } = assetViewingStore;
  let { slideshowState, slideshowNavigation } = slideshowStore;

  let oldAt: AssetGridRouteSearchParams | null | undefined = $state();

  let backUrl: string = $state(AppRoute.ALBUMS);
  let viewMode: AlbumPageViewMode = $state(AlbumPageViewMode.VIEW);
  let isCreatingSharedAlbum = $state(false);
  let isShowActivity = $state(false);
  let isLiked: ActivityResponseDto | null = $state(null);
  let reactions: ActivityResponseDto[] = $state([]);
  let albumOrder: AssetOrder | undefined = $state(data.album.order);

  const assetInteraction = new AssetInteraction();
  const timelineInteraction = new AssetInteraction();

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
    } else if (backUrl === AppRoute.SHARED_LINKS) {
      backUrl = history.state?.backUrl || AppRoute.ALBUMS;
    }
  });

  const handleToggleEnableActivity = async () => {
    try {
      const updateAlbum = await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          isActivityEnabled: !album.isActivityEnabled,
        },
      });

      album = { ...album, isActivityEnabled: updateAlbum.isActivityEnabled };

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

  const handleStartSlideshow = async () => {
    const asset =
      $slideshowNavigation === SlideshowNavigation.Shuffle
        ? await assetStore.getRandomAsset()
        : assetStore.buckets[0]?.dateGroups[0]?.intersetingAssets[0]?.asset;
    if (asset) {
      setAsset(asset);
      $slideshowState = SlideshowState.PlaySlideshow;
    }
  };

  const handleEscape = async () => {
    assetStore.suspendTransitions = true;
    if (viewMode === AlbumPageViewMode.SELECT_USERS) {
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }
    if (viewMode === AlbumPageViewMode.SELECT_THUMBNAIL) {
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }
    if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
      await handleCloseSelectAssets();
      return;
    }
    if (viewMode === AlbumPageViewMode.LINK_SHARING) {
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }
    if (viewMode === AlbumPageViewMode.OPTIONS) {
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }
    if ($showAssetViewer) {
      return;
    }
    if (assetInteraction.selectionActive) {
      cancelMultiselect(assetInteraction);
      return;
    }
    await goto(backUrl);
    return;
  };

  const refreshAlbum = async () => {
    album = await getAlbumInfo({ id: album.id, withoutAssets: true });
  };
  const handleAddAssets = async () => {
    const assetIds = timelineInteraction.selectedAssets.map((asset) => asset.id);

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

      timelineInteraction.clearMultiselect();
      await setModeToView();
    } catch (error) {
      handleError(error, $t('errors.error_adding_assets_to_album'));
    }
  };

  const setModeToView = async () => {
    assetStore.suspendTransitions = true;
    viewMode = AlbumPageViewMode.VIEW;
    await navigate(
      { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: { at: oldAt?.at } },
      { replaceState: true, forceNavigate: true },
    );
    oldAt = null;
  };

  const handleCloseSelectAssets = async () => {
    timelineInteraction.clearMultiselect();
    await setModeToView();
  };

  const handleSelectFromComputer = async () => {
    await openFileUploadDialog({ albumId: album.id });
    timelineInteraction.clearMultiselect();
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

      viewMode = AlbumPageViewMode.VIEW;
    } catch (error) {
      handleError(error, $t('errors.error_adding_users_to_album'));
    }
  };

  const handleRemoveUser = async (userId: string, nextViewMode: AlbumPageViewMode) => {
    if (userId == 'me' || userId === $user.id) {
      await goto(backUrl);
      return;
    }

    try {
      await refreshAlbum();

      // Dynamically set the view mode based on the passed argument
      viewMode = album.albumUsers.length > 0 ? nextViewMode : AlbumPageViewMode.VIEW;
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
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }

    try {
      await deleteAlbum({ id: album.id });
      await goto(backUrl);
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_album'));
    } finally {
      viewMode = AlbumPageViewMode.VIEW;
    }
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    assetStore.removeAssets(assetIds);
    await refreshAlbum();
  };

  const handleUpdateThumbnail = async (assetId: string) => {
    if (viewMode !== AlbumPageViewMode.SELECT_THUMBNAIL) {
      return;
    }

    await updateThumbnail(assetId);

    viewMode = AlbumPageViewMode.VIEW;
    assetInteraction.clearMultiselect();
  };

  const updateThumbnailUsingCurrentSelection = async () => {
    if (assetInteraction.selectedAssets.length === 1) {
      const [firstAsset] = assetInteraction.selectedAssets;
      assetInteraction.clearMultiselect();
      await updateThumbnail(firstAsset.id);
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
      notificationController.show({
        type: NotificationType.Info,
        message: $t('album_cover_updated'),
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

  let album = $derived(data.album);
  let albumId = $derived(album.id);

  $effect(() => {
    if (!album.isActivityEnabled && $numberOfComments === 0) {
      isShowActivity = false;
    }
  });

  let assetStore = new AssetStore();

  $effect(() => {
    if (viewMode === AlbumPageViewMode.VIEW) {
      void assetStore.updateOptions({ albumId, order: albumOrder });
    } else if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
      void assetStore.updateOptions({ isArchived: false, withPartners: true, timelineAlbumId: albumId });
    }
  });
  onDestroy(() => assetStore.destroy());
  // let timelineStore = new AssetStore();
  // $effect(() => void timelineStore.updateOptions({ isArchived: false, withPartners: true, timelineAlbumId: albumId }));
  // onDestroy(() => timelineStore.destroy());

  let isOwned = $derived($user.id == album.ownerId);

  let showActivityStatus = $derived(
    album.albumUsers.length > 0 && !$showAssetViewer && (album.isActivityEnabled || $numberOfComments > 0),
  );
  let isEditor = $derived(
    album.albumUsers.find(({ user: { id } }) => id === $user.id)?.role === AlbumUserRole.Editor ||
      album.ownerId === $user.id,
  );

  let albumHasViewers = $derived(album.albumUsers.some(({ role }) => role === AlbumUserRole.Viewer));
  $effect(() => {
    if (album.albumUsers.length > 0) {
      handlePromiseError(getFavorite());
      handlePromiseError(getNumberOfComments());
    }
  });
  const isShared = $derived(viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : album.albumUsers.length > 0);
  const isSelectionMode = $derived(
    viewMode === AlbumPageViewMode.SELECT_ASSETS ? true : viewMode === AlbumPageViewMode.SELECT_THUMBNAIL,
  );
  const singleSelect = $derived(
    viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : viewMode === AlbumPageViewMode.SELECT_THUMBNAIL,
  );
  const showArchiveIcon = $derived(viewMode !== AlbumPageViewMode.SELECT_ASSETS);
  const onSelect = ({ id }: { id: string }) => {
    if (viewMode !== AlbumPageViewMode.SELECT_ASSETS) {
      void handleUpdateThumbnail(id);
    }
  };
  const currentAssetIntersection = $derived(
    viewMode === AlbumPageViewMode.SELECT_ASSETS ? timelineInteraction : assetInteraction,
  );
</script>

<div class="flex overflow-hidden" use:scrollMemoryClearer={{ routeStartsWith: AppRoute.ALBUMS }}>
  <div class="relative w-full shrink">
    {#if assetInteraction.selectionActive}
      <AssetSelectControlBar
        assets={assetInteraction.selectedAssets}
        clearSelect={() => assetInteraction.clearMultiselect()}
      >
        <CreateSharedLink />
        <SelectAllAssets {assetStore} {assetInteraction} />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>
        {#if assetInteraction.isAllUserOwned}
          <FavoriteAction
            removeFavorite={assetInteraction.isAllFavorite}
            onFavorite={(ids, isFavorite) =>
              assetStore.updateAssetOperation(ids, (asset) => {
                asset.isFavorite = isFavorite;
                return { remove: false };
              })}
          ></FavoriteAction>
        {/if}
        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem filename="{album.albumName}.zip" />
          {#if assetInteraction.isAllUserOwned}
            <ChangeDate menuItem />
            <ChangeLocation menuItem />
            {#if assetInteraction.selectedAssets.length === 1}
              <MenuOption
                text={$t('set_as_album_cover')}
                icon={mdiImageOutline}
                onClick={() => updateThumbnailUsingCurrentSelection()}
              />
            {/if}
            <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
          {/if}

          {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
            <TagAction menuItem />
          {/if}

          {#if isOwned || assetInteraction.isAllUserOwned}
            <RemoveFromAlbum menuItem bind:album onRemove={handleRemoveAssets} />
          {/if}
          {#if assetInteraction.isAllUserOwned}
            <DeleteAssets menuItem onAssetDelete={handleRemoveAssets} />
          {/if}
        </ButtonContextMenu>
      </AssetSelectControlBar>
    {:else}
      {#if viewMode === AlbumPageViewMode.VIEW}
        <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(backUrl)}>
          {#snippet trailing()}
            {#if isEditor}
              <CircleIconButton
                title={$t('add_photos')}
                onclick={async () => {
                  assetStore.suspendTransitions = true;
                  viewMode = AlbumPageViewMode.SELECT_ASSETS;
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
                onclick={() => (viewMode = AlbumPageViewMode.SELECT_USERS)}
                icon={mdiShareVariantOutline}
              />
            {/if}

            {#if album.assetCount > 0}
              <CircleIconButton title={$t('slideshow')} onclick={handleStartSlideshow} icon={mdiPresentationPlay} />
              <CircleIconButton title={$t('download')} onclick={handleDownloadAlbum} icon={mdiFolderDownloadOutline} />
            {/if}

            {#if isOwned}
              <ButtonContextMenu icon={mdiDotsVertical} title={$t('album_options')}>
                {#if album.assetCount > 0}
                  <MenuOption
                    icon={mdiImageOutline}
                    text={$t('select_album_cover')}
                    onClick={() => (viewMode = AlbumPageViewMode.SELECT_THUMBNAIL)}
                  />
                  <MenuOption
                    icon={mdiCogOutline}
                    text={$t('options')}
                    onClick={() => (viewMode = AlbumPageViewMode.OPTIONS)}
                  />
                {/if}

                <MenuOption icon={mdiDeleteOutline} text={$t('delete_album')} onClick={() => handleRemoveAlbum()} />
              </ButtonContextMenu>
            {/if}

            {#if isCreatingSharedAlbum && album.albumUsers.length === 0}
              <Button
                size="sm"
                rounded="lg"
                disabled={album.assetCount === 0}
                onclick={() => (viewMode = AlbumPageViewMode.SELECT_USERS)}
              >
                {$t('share')}
              </Button>
            {/if}
          {/snippet}
        </ControlAppBar>
      {/if}

      {#if viewMode === AlbumPageViewMode.SELECT_ASSETS}
        <ControlAppBar onClose={handleCloseSelectAssets}>
          {#snippet leading()}
            <p class="text-lg dark:text-immich-dark-fg">
              {#if !timelineInteraction.selectionActive}
                {$t('add_to_album')}
              {:else}
                {$t('selected_count', { values: { count: timelineInteraction.selectedAssets.length } })}
              {/if}
            </p>
          {/snippet}

          {#snippet trailing()}
            <button
              type="button"
              onclick={handleSelectFromComputer}
              class="rounded-lg px-6 py-2 text-sm font-medium text-immich-primary transition-all hover:bg-immich-primary/10 dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/25"
            >
              {$t('select_from_computer')}
            </button>
            <Button size="sm" rounded="lg" disabled={!timelineInteraction.selectionActive} onclick={handleAddAssets}
              >{$t('done')}</Button
            >
          {/snippet}
        </ControlAppBar>
      {/if}

      {#if viewMode === AlbumPageViewMode.SELECT_THUMBNAIL}
        <ControlAppBar onClose={() => (viewMode = AlbumPageViewMode.VIEW)}>
          {#snippet leading()}
            {$t('select_album_cover')}
          {/snippet}
        </ControlAppBar>
      {/if}
    {/if}

    <main
      class="relative h-dvh overflow-hidden bg-immich-bg px-6 max-md:pt-[var(--navbar-height-md)] pt-[var(--navbar-height)] dark:bg-immich-dark-bg"
    >
      <AssetGrid
        enableRouting={viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : true}
        {album}
        {assetStore}
        assetInteraction={currentAssetIntersection}
        {isShared}
        {isSelectionMode}
        {singleSelect}
        {showArchiveIcon}
        {onSelect}
        onEscape={handleEscape}
      >
        {#if viewMode !== AlbumPageViewMode.SELECT_ASSETS}
          {#if viewMode !== AlbumPageViewMode.SELECT_THUMBNAIL}
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
                      onclick={() => (viewMode = AlbumPageViewMode.LINK_SHARING)}
                    />
                  {/if}

                  <!-- owner -->
                  <button type="button" onclick={() => (viewMode = AlbumPageViewMode.VIEW_USERS)}>
                    <UserAvatar user={album.owner} size="md" />
                  </button>

                  <!-- users with write access (collaborators) -->
                  {#each album.albumUsers.filter(({ role }) => role === AlbumUserRole.Editor) as { user } (user.id)}
                    <button type="button" onclick={() => (viewMode = AlbumPageViewMode.VIEW_USERS)}>
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
                      onclick={() => (viewMode = AlbumPageViewMode.VIEW_USERS)}
                    />
                  {/if}

                  {#if isOwned}
                    <CircleIconButton
                      color="gray"
                      size="20"
                      icon={mdiPlus}
                      onclick={() => (viewMode = AlbumPageViewMode.SELECT_USERS)}
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
                  onclick={() => (viewMode = AlbumPageViewMode.SELECT_ASSETS)}
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
        {/if}
      </AssetGrid>

      {#if showActivityStatus}
        <div class="absolute z-[2] bottom-0 end-0 mb-6 me-6 justify-self-end">
          <ActivityStatus
            disabled={!album.isActivityEnabled}
            {isLiked}
            numberOfComments={$numberOfComments}
            onFavorite={handleFavorite}
            onOpenActivityTab={handleOpenAndCloseActivityTab}
          />
        </div>
      {/if}
    </main>
  </div>
  {#if album.albumUsers.length > 0 && album && isShowActivity && $user && !$showAssetViewer}
    <div class="flex">
      <div
        transition:fly={{ duration: 150 }}
        id="activity-panel"
        class="z-[2] w-[360px] md:w-[460px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-s-immich-dark-gray dark:bg-immich-dark-bg"
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
{#if viewMode === AlbumPageViewMode.SELECT_USERS}
  <UserSelectionModal
    {album}
    onSelect={handleAddUsers}
    onShare={() => (viewMode = AlbumPageViewMode.LINK_SHARING)}
    onClose={() => (viewMode = AlbumPageViewMode.VIEW)}
  />
{/if}

{#if viewMode === AlbumPageViewMode.LINK_SHARING}
  <CreateSharedLinkModal albumId={album.id} onClose={() => (viewMode = AlbumPageViewMode.VIEW)} />
{/if}

{#if viewMode === AlbumPageViewMode.VIEW_USERS}
  <ShareInfoModal
    onClose={() => (viewMode = AlbumPageViewMode.VIEW)}
    {album}
    onRemove={(userId) => handleRemoveUser(userId, AlbumPageViewMode.VIEW_USERS)}
    onRefreshAlbum={refreshAlbum}
  />
{/if}

{#if viewMode === AlbumPageViewMode.OPTIONS && $user}
  <AlbumOptions
    {album}
    order={albumOrder}
    user={$user}
    onChangeOrder={async (order) => {
      albumOrder = order;
      await setModeToView();
    }}
    onRemove={(userId) => handleRemoveUser(userId, AlbumPageViewMode.OPTIONS)}
    onRefreshAlbum={refreshAlbum}
    onClose={() => (viewMode = AlbumPageViewMode.VIEW)}
    onToggleEnabledActivity={handleToggleEnableActivity}
    onShowSelectSharedUser={() => (viewMode = AlbumPageViewMode.SELECT_USERS)}
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
