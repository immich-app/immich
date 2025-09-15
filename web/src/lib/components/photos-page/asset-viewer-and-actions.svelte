<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import AssetViewerActions from '$lib/components/photos-page/asset-viewer-actions.svelte';
  import { AssetAction } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { type AlbumResponseDto, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';

  let { asset: viewingAsset, preloadAssets } = assetViewingStore;

  interface Props {
    timelineManager: TimelineManager;
    showSkeleton: boolean;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
  }

  let {
    timelineManager = $bindable(),
    showSkeleton = $bindable(false),
    removeAction,
    withStacked = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
  }: Props = $props();

  let handlePreAction = <(action: Action) => Promise<void>>$state();
  let handleAction = <(action: Action) => void>$state();
  let handleNext = <() => Promise<boolean>>$state();
  let handlePrevious = <() => Promise<boolean>>$state();
  let handleRandom = <() => Promise<AssetResponseDto | undefined>>$state();
  let handleClose = <(asset: { id: string }) => Promise<void>>$state();
</script>

<AssetViewerActions
  {timelineManager}
  {removeAction}
  bind:showSkeleton
  bind:handlePreAction
  bind:handleAction
  bind:handleNext
  bind:handlePrevious
  bind:handleRandom
  bind:handleClose
></AssetViewerActions>

{#await import('../asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    {withStacked}
    asset={$viewingAsset}
    preloadAssets={$preloadAssets}
    {isShared}
    {album}
    {person}
    preAction={handlePreAction}
    onAction={handleAction}
    onPrevious={handlePrevious}
    onNext={handleNext}
    onRandom={handleRandom}
    onClose={handleClose}
  />
{/await}
