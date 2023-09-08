<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import RestoreAssets from '$lib/components/photos-page/actions/restore-assets.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { TimeBucketSize } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;

  const assetStore = new AssetStore({ size: TimeBucketSize.Month, isTrashed: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <DeleteAssets force onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
    <RestoreAssets onRestore={(ids) => assetStore.removeAssets(ids)} />
  </AssetSelectControlBar>
{/if}

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectState} title={data.meta.title}>
  <AssetGrid {assetStore} {assetInteractionStore} removeAction={AssetAction.UNARCHIVE}>
    <EmptyPlaceholder text="Trashed photos and videos will show up here." alt="Empty trash can" slot="empty" />
  </AssetGrid>
</UserPageLayout>
