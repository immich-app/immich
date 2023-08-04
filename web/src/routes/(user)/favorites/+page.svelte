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
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { api, TimeBucketSize } from '@api';
  import { onMount } from 'svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  let assetCount = 1;

  const assetStore = new AssetStore({ size: TimeBucketSize.Month, isFavorite: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: isAllArchive = Array.from($selectedAssets).every((asset) => asset.isArchived);

  onMount(async () => {
    const { data: stats } = await api.assetApi.getAssetStats({ isFavorite: true });
    assetCount = stats.total;
  });
</script>

<!-- Multiselection mode app bar -->
{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <FavoriteAction removeFavorite onAssetFavorite={(asset) => assetStore.removeAsset(asset.id)} />
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <AssetSelectContextMenu icon={Plus} title="Add">
      <AddToAlbum />
      <AddToAlbum shared />
    </AssetSelectContextMenu>
    <DeleteAssets onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
    <AssetSelectContextMenu icon={DotsVertical} title="Menu">
      <DownloadAction menuItem />
      <ArchiveAction menuItem unarchive={isAllArchive} />
    </AssetSelectContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectState} title={data.meta.title} scrollbar={!assetCount}>
  {#if assetCount}
    <AssetGrid {assetStore} {assetInteractionStore} />
  {:else}
    <EmptyPlaceholder text="Add favorites to quickly find your best pictures and videos" alt="Empty favorites" />
  {/if}
</UserPageLayout>
