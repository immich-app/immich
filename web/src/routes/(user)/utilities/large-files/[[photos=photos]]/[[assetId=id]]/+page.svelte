<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import LargeAssetData from '$lib/components/utilities-page/large-assets/large-asset-data.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { handlePromiseError } from '$lib/utils';
  import { getNextAsset, getPreviousAsset } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, IconButton } from '@immich/ui';
  import { mdiSelectAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let assets = $state(data.assets);
  let asset = $derived(data.asset);

  let shiftKeyIsDown = $state(false);
  let lastAssetMouseEvent = $state<AssetResponseDto | null>(null);

  $effect(() => {
    if (asset) {
      assetViewerManager.setAsset(asset);
    }
  });

  const onRandom = async () => {
    if (assets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * assets.length);
    const asset = assets[index];
    await onViewAsset(asset);
    return asset;
  };

  const onAssetsDelete = (assetIds: string[]) => {
    assets = assets.filter(({ id }) => !assetIds.includes(id));
  };

  const onAction = (payload: Action) => {
    if (payload.type == 'trash' || payload.type == 'delete') {
      onAssetsDelete([payload.asset.id]);
      assetViewerManager.showAssetViewer(false);
    }
  };

  const handleSelectAssets = (asset: AssetResponseDto) => {
    const deselect = assetMultiSelectManager.hasSelectedAsset(asset.id);
    const timelineAsset = toTimelineAsset(asset);

    if (deselect) {
      for (const candidate of assetMultiSelectManager.candidates) {
        assetMultiSelectManager.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetMultiSelectManager.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetMultiSelectManager.candidates) {
        assetMultiSelectManager.selectAsset(candidate);
      }
      assetMultiSelectManager.selectAsset(timelineAsset);
    }

    assetMultiSelectManager.clearCandidates();
    assetMultiSelectManager.setAssetSelectionStart(deselect ? null : timelineAsset);
  };

  const selectAssetCandidates = (endAsset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetMultiSelectManager.startAsset;
    if (!startAsset) {
      return;
    }

    let start = assets.findIndex((a) => a.id === startAsset.id);
    let end = assets.findIndex((a) => a.id === endAsset.id);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetMultiSelectManager.setAssetSelectionCandidates(assets.slice(start, end + 1).map((a) => toTimelineAsset(a)));
  };

  const handleSelectAssetCandidates = (asset: AssetResponseDto | null) => {
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const onViewAsset = async (asset: AssetResponseDto) => {
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handlePreview = async (asset: AssetResponseDto) => {
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleSelectAll = () => {
    assetMultiSelectManager.selectAssets(assets.map((item) => toTimelineAsset(item)));
  };

  const handleOnClick = (clickedAsset: AssetResponseDto) => {
    if (assetMultiSelectManager.selectionActive) {
      handleSelectAssets(clickedAsset);
      return;
    }
    void onViewAsset(clickedAsset);
  };

  const handleEscape = () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
    if (event.key === 'Escape') {
      handleEscape();
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  const assetCursor = $derived({
    current: assetViewerManager.asset!,
    nextAsset: getNextAsset(assets, assetViewerManager.asset),
    previousAsset: getPreviousAsset(assets, assetViewerManager.asset),
  });

  const onAlbumAddAssets = () => {
    assetMultiSelectManager.clear();
  };

  $effect(() => {
    if (!lastAssetMouseEvent) {
      assetMultiSelectManager.clearCandidates();
    }
  });

  $effect(() => {
    if (!shiftKeyIsDown) {
      assetMultiSelectManager.clearCandidates();
    }
  });

  $effect(() => {
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      selectAssetCandidates(lastAssetMouseEvent);
    }
  });
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<OnEvents {onAssetsDelete} {onAlbumAddAssets} />

<UserPageLayout title={data.meta.title} scrollbar={true} hideNavbar={assetMultiSelectManager.selectionActive}>
  <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
    {#if assets && assets.length > 0}
      {#each assets as asset (asset.id)}
        <LargeAssetData
          {asset}
          selected={assetMultiSelectManager.hasSelectedAsset(asset.id)}
          selectionCandidate={assetMultiSelectManager.hasSelectionCandidate(asset.id)}
          onClick={handleOnClick}
          onSelect={handleSelectAssets}
          onPreview={assetMultiSelectManager.selectionActive ? handlePreview : undefined}
          onMouseEvent={handleSelectAssetCandidates}
        />
      {/each}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_assets_to_show')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    {@const Actions = getAssetBulkActions($t)}
    <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />
    <ActionButton action={Actions.AddToAlbum} />
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      aria-label={$t('select_all')}
      icon={mdiSelectAll}
      onclick={handleSelectAll}
    />
    <DeleteAssets onAssetDelete={onAssetsDelete} />
  </AssetSelectControlBar>
{/if}

{#if assetViewerManager.isViewing}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        cursor={assetCursor}
        showNavigation={assets.length > 1}
        {onRandom}
        {onAction}
        onClose={() => {
          assetViewerManager.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
