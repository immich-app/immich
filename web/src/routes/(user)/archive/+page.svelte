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
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import type { PageData } from './$types';
  import { mdiPlus, mdiDotsVertical } from '@mdi/js';
  import UpdatePanel from '$lib/components/shared-components/update-panel.svelte';

  export let data: PageData;

  const assetStore = new AssetStore({ isArchived: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <ArchiveAction unarchive onArchive={(ids) => assetStore.removeAssets(ids)} />
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <AssetSelectContextMenu icon={mdiPlus} title="Add">
      <AddToAlbum />
      <AddToAlbum shared />
    </AssetSelectContextMenu>
    <DeleteAssets onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
    <AssetSelectContextMenu icon={mdiDotsVertical} title="Add">
      <DownloadAction menuItem />
      <FavoriteAction menuItem removeFavorite={isAllFavorite} />
    </AssetSelectContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={$isMultiSelectState} title={data.meta.title} scrollbar={false}>
  <AssetGrid {assetStore} {assetInteractionStore} removeAction={AssetAction.UNARCHIVE}>
    <EmptyPlaceholder
      text="Archive photos and videos to hide them from your Photos view"
      alt="Empty archive"
      slot="empty"
    />
  </AssetGrid>
</UserPageLayout>
<UpdatePanel {assetStore} />
