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
  import { assetInteractionStore, isMultiSelectStoreState, selectedAssets } from '$lib/stores/asset-interaction.store';
  import { assetStore } from '$lib/stores/assets.store';
  import { onDestroy, onMount } from 'svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';
  import { api } from '@api';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';

  export let data: PageData;
  let assetCount = 1;

  onMount(async () => {
    const { data: allAssetCount } = await api.assetApi.getAssetCountByUserId();
    assetCount = allAssetCount.total;
  });

  onDestroy(() => {
    assetInteractionStore.clearMultiselect();
  });

  $: isAllFavorite = Array.from($selectedAssets).every((asset) => asset.isFavorite);

  const handleUpload = async () => {
    openFileUploadDialog();
  };
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectStoreState} showUploadButton>
  <svelte:fragment slot="header">
    {#if $isMultiSelectStoreState}
      <AssetSelectControlBar assets={$selectedAssets} clearSelect={assetInteractionStore.clearMultiselect}>
        <CreateSharedLink />
        <SelectAllAssets />
        <AssetSelectContextMenu icon={Plus} title="Add">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        <DeleteAssets onAssetDelete={assetStore.removeAsset} />
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
      <AssetGrid showMemoryLane />
    {:else}
      <EmptyPlaceholder text="CLICK TO UPLOAD YOUR FIRST PHOTO" actionHandler={handleUpload} />
    {/if}
  </svelte:fragment>
</UserPageLayout>
