<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import type { PageData } from './$types';
  import { mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { onDestroy } from 'svelte';

  export let data: PageData;

  const assetStore = new AssetStore({ isFavorite: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  $: isAllArchive = [...$selectedAssets].every((asset) => asset.isArchived);

  onDestroy(() => {
    assetStore.destroy();
  });
</script>

<!-- Multiselection mode app bar -->
{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <FavoriteAction removeFavorite onFavorite={(assetIds) => assetStore.removeAssets(assetIds)} />
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
      <AddToAlbum />
      <AddToAlbum shared />
    </ButtonContextMenu>
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <ArchiveAction menuItem unarchive={isAllArchive} onArchive={(assetIds) => assetStore.removeAssets(assetIds)} />
      <DeleteAssets menuItem onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={$isMultiSelectState} title={data.meta.title} scrollbar={false}>
  <AssetGrid enableRouting={true} {assetStore} {assetInteractionStore} removeAction={AssetAction.UNFAVORITE}>
    <EmptyPlaceholder text={$t('no_favorites_message')} slot="empty" />
  </AssetGrid>
</UserPageLayout>
