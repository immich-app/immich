<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import { getAssetDuplicates, type AssetResponseDto } from '@immich/sdk';
  import type { Viewport } from '$lib/stores/assets.store';
  import { onMount } from 'svelte';
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
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import type { PageData } from './$types';
  import { mdiPlus, mdiDotsVertical } from '@mdi/js';

  export let data: PageData;

  let assets: AssetResponseDto[] = [];
  const viewport: Viewport = { width: 0, height: 0 };

  onMount(async () => {
    assets = await getAssetDuplicates();
  });

  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: isEmpty = assets.length === 0;

  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <AssetSelectContextMenu icon={mdiPlus} title="Add to...">
      <AddToAlbum />
      <AddToAlbum shared />
    </AssetSelectContextMenu>
    <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
    <AssetSelectContextMenu icon={mdiDotsVertical} title="Add">
      <DownloadAction menuItem />
      <DeleteAssets menuItem onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
    </AssetSelectContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={$isMultiSelectState} title={data.meta.title} scrollbar={false}>
  <section
    class="relative mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4 {isEmpty ? 'm-0' : 'ml-4 tall:ml-0 mr-[60px]'}"
    bind:clientHeight={viewport.height}
    bind:clientWidth={viewport.width}
  >
    {#if isEmpty}
      <EmptyPlaceholder text="This is where Duplicates show up." />
    {/if}
    <GalleryViewer {assets} {viewport}></GalleryViewer>
  </section>
</UserPageLayout>
