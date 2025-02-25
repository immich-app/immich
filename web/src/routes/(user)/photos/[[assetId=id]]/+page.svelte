<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
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
  import { AssetAction, QueryParameter, type IQueryParameter } from '$lib/constants';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { preferences, user } from '$lib/stores/user.store';
  import type { OnLink, OnUnlink } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetTypeEnum } from '@immich/sdk';
  import { mdiArrowLeft, mdiClose, mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import SideBarLink from '$lib/components/shared-components/side-bar/side-bar-link.svelte';
  // import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';

  interface Props {
    data: PageData;
  }

  const { data }: Props = $props();
  // let options: { coordinates?: { x1?: number; x2?: number; y1?: number; y2?: number } } = $derived(() => data.options);
  let options: IQueryParameter = data.options; //  $derived(() => data.options)();
  let x1 = options.coordinates ? options.coordinates.x1 : undefined;
  let x2 = options.coordinates ? options.coordinates.x2 : undefined;
  let y1 = options.coordinates ? options.coordinates.y1 : undefined;
  let y2 = options.coordinates ? options.coordinates.y2 : undefined;
  // TODO: when getTimebuckets support withArchived
  const isArchived = false;
  const withStacked = true;
  // let withPartners = $derived(() => (options.assetGridOptions ? options.assetGridOptions.withPartners : true));
  // const isFavorite = $derived(() => (options.assetGridOptions?.onlyFavorites ? true : undefined));
  const showCustomSidebar = $derived(() => options.previousRoute !== undefined || options.coordinates !== undefined);

  let { isViewing: showAssetViewer } = assetViewingStore;
  // const assetStore = $derived(
  //   () => new AssetStore({ isArchived, withStacked, withPartners: false, isFavorite: false, x1, x2, y1, y2 }),
  // );
  const assetStore = new AssetStore({
    isArchived,
    withStacked,
    withPartners: false,
    isFavorite: false,
    x1,
    x2,
    y1,
    y2,
  });
  const assetInteraction = new AssetInteraction();

  let selectedAssets = $derived(assetInteraction.selectedAssetsArray);
  let isAssetStackSelected = $derived(selectedAssets.length === 1 && !!selectedAssets[0].stack);
  let isLinkActionAvailable = $derived.by(() => {
    const isLivePhoto = selectedAssets.length === 1 && !!selectedAssets[0].livePhotoVideoId;
    const isLivePhotoCandidate =
      selectedAssets.length === 2 &&
      selectedAssets.some((asset) => asset.type === AssetTypeEnum.Image) &&
      selectedAssets.some((asset) => asset.type === AssetTypeEnum.Video);

    return assetInteraction.isAllUserOwned && (isLivePhoto || isLivePhotoCandidate);
  });
  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const handleLink: OnLink = ({ still, motion }) => {
    assetStore.removeAssets([motion.id]);
    assetStore.updateAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    assetStore.addAssets([motion]);
    assetStore.updateAssets([still]);
  };

  onDestroy(() => {
    assetStore.destroy();
  });

  beforeNavigate(() => {
    isFaceEditMode.value = false;
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

{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    ownerId={$user.id}
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteraction} />
    <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
      <AddToAlbum />
      <AddToAlbum shared />
    </ButtonContextMenu>
    <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      {#if assetInteraction.selectedAssets.size > 1 || isAssetStackSelected}
        <StackAction
          unstack={isAssetStackSelected}
          onStack={(assetIds) => assetStore.removeAssets(assetIds)}
          onUnstack={(assets) => assetStore.addAssets(assets)}
        />
      {/if}
      {#if isLinkActionAvailable}
        <LinkLivePhotoAction
          menuItem
          unlink={assetInteraction.selectedAssets.size === 1}
          onLink={handleLink}
          onUnlink={handleUnlink}
        />
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

<UserPageLayout hideNavbar={assetInteraction.selectionActive} showUploadButton scrollbar={false}>
  <AssetGrid
    enableRouting={true}
    {assetStore}
    {assetInteraction}
    removeAction={AssetAction.ARCHIVE}
    onEscape={handleEscape}
    withStacked
  >
    {#if $preferences.memories.enabled}
      <MemoryLane />
    {/if}
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => openFileUploadDialog()} />
    {/snippet}
  </AssetGrid>
</UserPageLayout>
