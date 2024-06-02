<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import StackAction from '$lib/components/photos-page/actions/stack-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MemoryLane from '$lib/components/photos-page/memory-lane.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { preferences, user } from '$lib/stores/user.store';

  let { isViewing: showAssetViewer } = assetViewingStore;
  const assetStore = new AssetStore({ isArchived: false, withStacked: true, withPartners: true });
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
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar
    ownerId={$user.id}
    assets={$selectedAssets}
    clearSelect={() => assetInteractionStore.clearMultiselect()}
  >
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <AssetSelectContextMenu icon={mdiPlus} title="Add to...">
      <AddToAlbum />
      <AddToAlbum shared />
    </AssetSelectContextMenu>
    <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
    <AssetSelectContextMenu icon={mdiDotsVertical} title="Menu">
      <DownloadAction menuItem />
      {#if $selectedAssets.size > 1 || isAssetStackSelected}
        <StackAction
          unstack={isAssetStackSelected}
          onStack={(assetIds) => assetStore.removeAssets(assetIds)}
          onUnstack={(assets) => assetStore.addAssets(assets)}
        />
      {/if}
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <ArchiveAction menuItem onArchive={(assetIds) => assetStore.removeAssets(assetIds)} />
      <DeleteAssets menuItem onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
      <hr />
      <AssetJobActions />
    </AssetSelectContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={$isMultiSelectState} showUploadButton scrollbar={false}>
  <AssetGrid
    {assetStore}
    {assetInteractionStore}
    removeAction={AssetAction.ARCHIVE}
    on:escape={handleEscape}
    withStacked
  >
    {#if $preferences.memories.enabled}
      <MemoryLane />
    {/if}
    <EmptyPlaceholder text="CLICK TO UPLOAD YOUR FIRST PHOTO" onClick={() => openFileUploadDialog()} slot="empty" />
  </AssetGrid>
</UserPageLayout>
