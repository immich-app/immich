<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
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
  import { TimeBucketSize } from '@api';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';

  export let data: PageData;

  let { isViewing: showAssetViewer } = assetViewingStore;
  let handleEscapeKey = false;
  const assetStore = new AssetStore({ size: TimeBucketSize.Month, isArchived: false });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: isAllFavorite = Array.from($selectedAssets).every((asset) => asset.isFavorite);

  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if (handleEscapeKey) {
      handleEscapeKey = false;
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    }
  };
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectState} showUploadButton>
  <svelte:fragment slot="header">
    {#if $isMultiSelectState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
        <CreateSharedLink on:escape={() => (handleEscapeKey = true)} />
        <SelectAllAssets {assetStore} {assetInteractionStore} />
        <AssetSelectContextMenu icon={Plus} title="Add">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        <DeleteAssets
          on:escape={() => (handleEscapeKey = true)}
          onAssetDelete={(assetId) => assetStore.removeAsset(assetId)}
        />
        <AssetSelectContextMenu icon={DotsVertical} title="Menu">
          <FavoriteAction menuItem removeFavorite={isAllFavorite} />
          <DownloadAction menuItem />
          <ArchiveAction menuItem onArchive={(ids) => assetStore.removeAssets(ids)} />
          <AssetJobActions />
        </AssetSelectContextMenu>
      </AssetSelectControlBar>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="content">
    <AssetGrid {assetStore} {assetInteractionStore} removeAction={AssetAction.ARCHIVE} on:escape={handleEscape}>
      {#if data.user.memoriesEnabled}
        <MemoryLane />
      {/if}
      <EmptyPlaceholder
        text="CLICK TO UPLOAD YOUR FIRST PHOTO"
        actionHandler={() => openFileUploadDialog()}
        slot="empty"
      />
    </AssetGrid>
  </svelte:fragment>
</UserPageLayout>
