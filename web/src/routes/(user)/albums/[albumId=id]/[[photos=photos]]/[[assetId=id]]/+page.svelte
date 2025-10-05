<script lang="ts">
  import { afterNavigate, goto, onNavigate } from '$app/navigation';
  import { scrollMemoryClearer } from '$lib/actions/scroll-memory';
  import CastButton from '$lib/cast/cast-button.svelte';
  import AlbumDescription from '$lib/components/album-page/album-description.svelte';
  import AlbumMap from '$lib/components/album-page/album-map.svelte';
  import AlbumSummary from '$lib/components/album-page/album-summary.svelte';
  import AlbumTitle from '$lib/components/album-page/album-title.svelte';
  import ActivityStatus from '$lib/components/asset-viewer/activity-status.svelte';
  import ActivityViewer from '$lib/components/asset-viewer/activity-viewer.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import RemoveFromAlbum from '$lib/components/timeline/actions/RemoveFromAlbumAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AlbumPageViewMode, AppRoute } from '$lib/constants';
  import { activityManager } from '$lib/managers/activity-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import AlbumOptionsModal from '$lib/modals/AlbumOptionsModal.svelte';
  import AlbumShareModal from '$lib/modals/AlbumShareModal.svelte';
  import AlbumUsersModal from '$lib/modals/AlbumUsersModal.svelte';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { handlePromiseError, makeSharedLinkUrl } from '$lib/utils';
  import { confirmAlbumDelete } from '$lib/utils/album-utils';
  import { cancelMultiselect, downloadAlbum } from '$lib/utils/asset-utils';
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
    AssetVisibility,
    addAssetsToAlbum,
    addUsersToAlbum,
    deleteAlbum,
    getAlbumInfo,
    updateAlbumInfo,
    type AlbumUserAddDto,
  } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiCogOutline,
    mdiDeleteOutline,
    mdiDotsVertical,
    mdiDownload,
    mdiImageOutline,
    mdiImagePlusOutline,
    mdiLink,
    mdiPlus,
    mdiPresentationPlay,
    mdiShareVariantOutline,
    mdiUpload,
  } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let { isViewing: showAssetViewer, setAssetId, gridScrollTarget } = assetViewingStore;
  let { slideshowState, slideshowNavigation } = slideshowStore;

  let oldAt: AssetGridRouteSearchParams | null | undefined = $state();

  let backUrl: string = $state(AppRoute.ALBUMS);
  let viewMode: AlbumPageViewMode = $state(AlbumPageViewMode.VIEW);
  let isCreatingSharedAlbum = $state(false);
  let isShowActivity = $state(false);
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

  const handleFavorite = async () => {
    try {
      await activityManager.toggleLike();
    } catch (error) {
      handleError(error, $t('errors.cant_change_asset_favorite'));
    }
  };

  const handleOpenAndCloseActivityTab = () => {
    isShowActivity = !isShowActivity;
  };

  const handleStartSlideshow = async () => {
    const asset =
      $slideshowNavigation === SlideshowNavigation.Shuffle
        ? await timelineManager.getRandomAsset()
        : timelineManager.months[0]?.dayGroups[0]?.viewerAssets[0]?.asset;
    if (asset) {
      handlePromiseError(setAssetId(asset.id).then(() => ($slideshowState = SlideshowState.PlaySlideshow)));
    }
  };

  const handleEscape = async () => {
    timelineManager.suspendTransitions = true;
    if (viewMode === AlbumPageViewMode.SELECT_THUMBNAIL) {
      viewMode = AlbumPageViewMode.VIEW;
      return;
    }
    if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
      await handleCloseSelectAssets();
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
    timelineManager.suspendTransitions = true;
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

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    await refreshAlbum();
  };

  const handleUndoRemoveAssets = async (assets: TimelineAsset[]) => {
    timelineManager.addAssets(assets);
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
    if (!album.isActivityEnabled && activityManager.commentCount === 0) {
      isShowActivity = false;
    }
  });

  let timelineManager = new TimelineManager();

  $effect(() => {
    if (viewMode === AlbumPageViewMode.VIEW) {
      void timelineManager.updateOptions({ albumId, order: albumOrder });
    } else if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
      void timelineManager.updateOptions({
        visibility: AssetVisibility.Timeline,
        withPartners: true,
        timelineAlbumId: albumId,
      });
    }
  });

  const isShared = $derived(viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : album.albumUsers.length > 0);

  $effect(() => {
    if ($showAssetViewer || !isShared) {
      return;
    }

    handlePromiseError(activityManager.init(album.id));
  });

  onDestroy(() => {
    activityManager.reset();
    timelineManager.destroy();
  });

  let isOwned = $derived($user.id == album.ownerId);

  let showActivityStatus = $derived(
    album.albumUsers.length > 0 && !$showAssetViewer && (album.isActivityEnabled || activityManager.commentCount > 0),
  );
  let isEditor = $derived(
    album.albumUsers.find(({ user: { id } }) => id === $user.id)?.role === AlbumUserRole.Editor ||
      album.ownerId === $user.id,
  );

  let albumHasViewers = $derived(album.albumUsers.some(({ role }) => role === AlbumUserRole.Viewer));
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

  const handleShare = async () => {
    const result = await modalManager.show(AlbumShareModal, { album });

    switch (result?.action) {
      case 'sharedLink': {
        await handleShareLink();
        return;
      }

      case 'sharedUsers': {
        await handleAddUsers(result.data);
        return;
      }
    }
  };

  const handleShareLink = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, { albumId: album.id });
    if (sharedLink) {
      await refreshAlbum();
      await modalManager.show(QrCodeModal, { title: $t('view_link'), value: makeSharedLinkUrl(sharedLink) });
    }
  };

  const handleEditUsers = async () => {
    const changed = await modalManager.show(AlbumUsersModal, { album });

    if (changed) {
      await refreshAlbum();
    }
  };

  const handleOptions = async () => {
    const result = await modalManager.show(AlbumOptionsModal, { album, order: albumOrder, user: $user });

    if (!result) {
      return;
    }

    switch (result.action) {
      case 'changeOrder': {
        albumOrder = result.order;
        break;
      }
      case 'shareUser': {
        await handleShare();
        break;
      }
      case 'refreshAlbum': {
        await refreshAlbum();
        break;
      }
    }
  };
</script>

<div class="flex overflow-hidden" use:scrollMemoryClearer={{ routeStartsWith: AppRoute.ALBUMS }}>
  <div class="relative w-full shrink">
    <main class="relative h-dvh overflow-hidden px-2 md:px-6 max-md:pt-(--navbar-height-md) pt-(--navbar-height)">
      <Timeline
        enableRouting={viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : true}
        {album}
        {timelineManager}
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
                    <IconButton
                      aria-label={$t('create_link_to_share')}
                      color="secondary"
                      size="medium"
                      shape="round"
                      icon={mdiLink}
                      onclick={handleShareLink}
                    />
                  {/if}

                  <!-- owner -->
                  <button type="button" onclick={handleEditUsers}>
                    <UserAvatar user={album.owner} size="md" />
                  </button>

                  <!-- users with write access (collaborators) -->
                  {#each album.albumUsers.filter(({ role }) => role === AlbumUserRole.Editor) as { user } (user.id)}
                    <button type="button" onclick={handleEditUsers}>
                      <UserAvatar {user} size="md" />
                    </button>
                  {/each}

                  <!-- display ellipsis if there are readonly users too -->
                  {#if albumHasViewers}
                    <IconButton
                      shape="round"
                      aria-label={$t('view_all_users')}
                      color="secondary"
                      size="medium"
                      icon={mdiDotsVertical}
                      onclick={handleEditUsers}
                    />
                  {/if}

                  {#if isOwned}
                    <IconButton
                      shape="round"
                      color="secondary"
                      size="medium"
                      icon={mdiPlus}
                      onclick={handleShare}
                      aria-label={$t('add_more_users')}
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
                <p class="uppercase text-xs dark:text-immich-dark-fg">{$t('add_photos')}</p>
                <button
                  type="button"
                  onclick={() => (viewMode = AlbumPageViewMode.SELECT_ASSETS)}
                  class="mt-5 bg-subtle flex w-full place-items-center gap-6 rounded-2xl border px-8 py-8 text-immich-fg transition-all hover:bg-gray-100 dark:hover:bg-gray-500/20 hover:text-immich-primary dark:border-none dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
                >
                  <span class="text-primary">
                    <Icon icon={mdiPlus} size="24" />
                  </span>
                  <span class="text-lg">{$t('select_photos')}</span>
                </button>
              </div>
            </section>
          {/if}
        {/if}
      </Timeline>

      {#if showActivityStatus && !activityManager.isLoading}
        <div class="absolute z-2 bottom-0 end-0 mb-6 me-6 justify-self-end">
          <ActivityStatus
            disabled={!album.isActivityEnabled}
            isLiked={activityManager.isLiked}
            numberOfComments={activityManager.commentCount}
            numberOfLikes={undefined}
            onFavorite={handleFavorite}
            onOpenActivityTab={handleOpenAndCloseActivityTab}
          />
        </div>
      {/if}
    </main>

    {#if assetInteraction.selectionActive}
      <AssetSelectControlBar
        assets={assetInteraction.selectedAssets}
        clearSelect={() => assetInteraction.clearMultiselect()}
      >
        <CreateSharedLink />
        <SelectAllAssets {timelineManager} {assetInteraction} />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>
        {#if assetInteraction.isAllUserOwned}
          <FavoriteAction
            removeFavorite={assetInteraction.isAllFavorite}
            onFavorite={(ids, isFavorite) =>
              timelineManager.updateAssetOperation(ids, (asset) => {
                asset.isFavorite = isFavorite;
                return { remove: false };
              })}
          ></FavoriteAction>
        {/if}
        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: 175, y: 25 }}>
          <DownloadAction menuItem filename="{album.albumName}.zip" />
          {#if assetInteraction.isAllUserOwned}
            <ChangeDate menuItem />
            <ChangeDescription menuItem />
            <ChangeLocation menuItem />
            {#if assetInteraction.selectedAssets.length === 1}
              <MenuOption
                text={$t('set_as_album_cover')}
                icon={mdiImageOutline}
                onClick={() => updateThumbnailUsingCurrentSelection()}
              />
            {/if}
            <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
            <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
          {/if}

          {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
            <TagAction menuItem />
          {/if}

          {#if isOwned || assetInteraction.isAllUserOwned}
            <RemoveFromAlbum menuItem bind:album onRemove={handleRemoveAssets} />
          {/if}
          {#if assetInteraction.isAllUserOwned}
            <DeleteAssets menuItem onAssetDelete={handleRemoveAssets} onUndoDelete={handleUndoRemoveAssets} />
          {/if}
        </ButtonContextMenu>
      </AssetSelectControlBar>
    {:else}
      {#if viewMode === AlbumPageViewMode.VIEW}
        <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(backUrl)}>
          {#snippet trailing()}
            <CastButton />

            {#if isEditor}
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                aria-label={$t('add_photos')}
                onclick={async () => {
                  timelineManager.suspendTransitions = true;
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
              <IconButton
                shape="round"
                variant="ghost"
                color="secondary"
                aria-label={$t('share')}
                onclick={handleShare}
                icon={mdiShareVariantOutline}
              />
            {/if}

            {#if $featureFlags.loaded && $featureFlags.map}
              <AlbumMap {album} />
            {/if}

            {#if album.assetCount > 0}
              <IconButton
                shape="round"
                variant="ghost"
                color="secondary"
                aria-label={$t('slideshow')}
                onclick={handleStartSlideshow}
                icon={mdiPresentationPlay}
              />
              <IconButton
                shape="round"
                variant="ghost"
                color="secondary"
                aria-label={$t('download')}
                onclick={handleDownloadAlbum}
                icon={mdiDownload}
              />
            {/if}

            {#if isOwned}
              <ButtonContextMenu
                icon={mdiDotsVertical}
                title={$t('album_options')}
                color="secondary"
                offset={{ x: 175, y: 25 }}
              >
                {#if album.assetCount > 0}
                  <MenuOption
                    icon={mdiImageOutline}
                    text={$t('select_album_cover')}
                    onClick={() => (viewMode = AlbumPageViewMode.SELECT_THUMBNAIL)}
                  />
                  <MenuOption icon={mdiCogOutline} text={$t('options')} onClick={handleOptions} />
                {/if}

                <MenuOption icon={mdiDeleteOutline} text={$t('delete_album')} onClick={() => handleRemoveAlbum()} />
              </ButtonContextMenu>
            {/if}

            {#if isCreatingSharedAlbum && album.albumUsers.length === 0}
              <Button size="small" disabled={album.assetCount === 0} onclick={handleShare}>
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
            <Button variant="ghost" leadingIcon={mdiUpload} onclick={handleSelectFromComputer}
              >{$t('select_from_computer')}</Button
            >
            <Button disabled={!timelineInteraction.selectionActive} onclick={handleAddAssets}>{$t('done')}</Button>
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
  </div>
  {#if album.albumUsers.length > 0 && album && isShowActivity && $user && !$showAssetViewer}
    <div class="flex">
      <div
        transition:fly={{ duration: 150 }}
        id="activity-panel"
        class="z-2 w-[360px] md:w-[460px] overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray"
        translate="yes"
      >
        <ActivityViewer
          user={$user}
          disabled={!album.isActivityEnabled}
          albumOwnerId={album.ownerId}
          albumId={album.id}
          onClose={handleOpenAndCloseActivityTab}
        />
      </div>
    </div>
  {/if}
</div>

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
