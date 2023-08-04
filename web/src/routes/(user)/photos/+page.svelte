<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
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
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { TimeGroupEnum, api } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  let assetCount = 1;

  const assetStore = new AssetStore({ timeGroup: TimeGroupEnum.Month });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  onMount(async () => {
    const { data: stats } = await api.assetApi.getAssetStats();
    assetCount = stats.total;
  });

  onDestroy(() => {
    assetInteractionStore.clearMultiselect();
  });

  $: isAllFavorite = Array.from($selectedAssets).every((asset) => asset.isFavorite);

  const handleUpload = async () => {
    openFileUploadDialog();
  };
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectState} showUploadButton>
  <svelte:fragment slot="header">
    {#if $isMultiSelectState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={assetInteractionStore.clearMultiselect}>
        <CreateSharedLink />
        <SelectAllAssets {assetStore} {assetInteractionStore} />
        <AssetSelectContextMenu icon={Plus} title="Add">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        <DeleteAssets onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
        <AssetSelectContextMenu icon={DotsVertical} title="Menu">
          <FavoriteAction menuItem removeFavorite={isAllFavorite} />
          <DownloadAction menuItem />
          <ArchiveAction menuItem onAssetArchive={(asset) => assetStore.removeAsset(asset.id)} />
        </AssetSelectContextMenu>
      </AssetSelectControlBar>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if assetCount}
      <AssetGrid {assetStore} {assetInteractionStore}>
        <MemoryLane />
      </AssetGrid>
    {:else}
      <EmptyPlaceholder text="CLICK TO UPLOAD YOUR FIRST PHOTO" actionHandler={handleUpload} />
    {/if}
  </svelte:fragment>
</UserPageLayout>
