<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import LinkLivePhotoAction from '$lib/components/photos-page/actions/link-live-photo-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import StackAction from '$lib/components/photos-page/actions/stack-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MemoryLane from '$lib/components/photos-page/memory-lane.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction, QueryParameter } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { mdiArrowLeft, mdiClose, mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { preferences, user } from '$lib/stores/user.store';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import SideBarLink from '$lib/components/shared-components/side-bar/side-bar-link.svelte';
  import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';

  export let data: PageData;
  $: options = data.options;

  $: x1 = options.coordinates ? options.coordinates.x1 : undefined;
  $: x2 = options.coordinates ? options.coordinates.x2 : undefined;
  $: y1 = options.coordinates ? options.coordinates.y1 : undefined;
  $: y2 = options.coordinates ? options.coordinates.y2 : undefined;

  // TODO: when getTimebuckets support withArchived
  const isArchived = false;
  const withStacked = undefined;
  $: withPartners = options.assetGridOptions ? options.assetGridOptions.withPartners : true;
  $: isFavorite = options.assetGridOptions?.onlyFavorites ? true : undefined;
  $: showCustomSidebar = options.previousRoute !== undefined || options.coordinates !== undefined;

  let { isViewing: showAssetViewer } = assetViewingStore;
  $: assetStore = new AssetStore({ isArchived, withStacked, withPartners, isFavorite, x1, x2, y1, y2 });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  let isAllFavorite: boolean;
  let isAssetStackSelected: boolean;

  $: {
    const selection = [...$selectedAssets];
    isAllFavorite = selection.every((asset) => asset.isFavorite);
    isAssetStackSelected = selection.length === 1 && !!selection[0].stack;
  }

  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    }
  };

  const handleLink = (asset: AssetResponseDto) => {
    if (asset.livePhotoVideoId) {
      assetStore.removeAssets([asset.livePhotoVideoId]);
    }
    assetStore.updateAssets([asset]);
  };

  onDestroy(() => {
    assetStore.destroy();
  });
  const closePreviousRoute = async () => {
    const newUrl = new URL($page.url);
    if (options.previousRoute) {
      newUrl.searchParams.delete(QueryParameter.PREVIOUS_ROUTE);
    }
    if (options.coordinates) {
      newUrl.searchParams.delete(QueryParameter.COORDINATESX1);
      newUrl.searchParams.delete(QueryParameter.COORDINATESX2);
      newUrl.searchParams.delete(QueryParameter.COORDINATESY1);
      newUrl.searchParams.delete(QueryParameter.COORDINATESY2);
    }
    if (options.assetGridOptions) {
      newUrl.searchParams.delete(QueryParameter.ASSET_GRID_OPTIONS);
    }

    options = {};
    await goto(newUrl);
  };
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar
    ownerId={$user.id}
    assets={$selectedAssets}
    clearSelect={() => assetInteractionStore.clearMultiselect()}
  >
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
      <AddToAlbum />
      <AddToAlbum shared />
    </ButtonContextMenu>
    <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      {#if $selectedAssets.size > 1 || isAssetStackSelected}
        <StackAction
          unstack={isAssetStackSelected}
          onStack={(assetIds) => assetStore.removeAssets(assetIds)}
          onUnstack={(assets) => assetStore.addAssets(assets)}
        />
      {/if}
      {#if $selectedAssets.size === 2 && [...$selectedAssets].some((asset) => asset.type === AssetTypeEnum.Image && [...$selectedAssets].some((asset) => asset.type === AssetTypeEnum.Video))}
        <LinkLivePhotoAction menuItem onLink={handleLink} />
      {/if}
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <ArchiveAction menuItem onArchive={(assetIds) => assetStore.removeAssets(assetIds)} />
      {#if $preferences.tags.enabled}
        <TagAction menuItem />
      {/if}
      <DeleteAssets menuItem onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
      <hr />
      <AssetJobActions />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout {showCustomSidebar} hideNavbar={$isMultiSelectState} showUploadButton scrollbar={false}>
  <slot slot="customSidebar">
    {#if options.previousRoute}
      <a href={options.previousRoute}>
        <SideBarLink title={$t('previous')} routeId={`/(user)${options.previousRoute}`} icon={mdiArrowLeft} />
      </a>
    {/if}
    {#if options.previousRoute !== undefined || options.coordinates !== undefined}
      <SideBarButton title={$t('close')} icon={mdiClose} moreInformation={false} onClick={closePreviousRoute} />
    {/if}
  </slot>
  {#key options}
    <AssetGrid
      enableRouting={true}
      {assetStore}
      {assetInteractionStore}
      removeAction={AssetAction.ARCHIVE}
      on:escape={handleEscape}
      withStacked
    >
      {#if $preferences.memories.enabled}
        <MemoryLane />
      {/if}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => openFileUploadDialog()} slot="empty" />
    </AssetGrid>
  {/key}
</UserPageLayout>
