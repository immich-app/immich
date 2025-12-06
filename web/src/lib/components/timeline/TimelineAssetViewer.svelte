<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AssetAction } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAssetInfo, type AlbumResponseDto, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { untrack } from 'svelte';

  let { asset: viewingAsset, gridScrollTarget } = assetViewingStore;

  interface Props {
    timelineManager: TimelineManager;
    invisible: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;

    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE
      | null;
  }

  let {
    timelineManager,
    invisible = $bindable(false),
    removeAction,
    withStacked = false,
    isShared = false,
    album = null,
    person = null,
  }: Props = $props();

  const getNextAsset = async (currentAsset: AssetResponseDto) => {
    const earlierTimelineAsset = await timelineManager.getEarlierAsset(currentAsset);
    if (earlierTimelineAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: earlierTimelineAsset.id });
      return asset;
    }
  };

  const getPreviousAsset = async (currentAsset: AssetResponseDto) => {
    const laterTimelineAsset = await timelineManager.getLaterAsset(currentAsset);
    if (laterTimelineAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: laterTimelineAsset.id });
      return asset;
    }
  };

  let assetCursor = $state<{
    previousAsset: AssetResponseDto | undefined;
    current: AssetResponseDto;
    nextAsset: AssetResponseDto | undefined;
  }>({
    current: $viewingAsset,
    previousAsset: undefined,
    nextAsset: undefined,
  });

  const loadCloseAssets = async (currentAsset: AssetResponseDto) => {
    const [nextAsset, previousAsset] = await Promise.all([getNextAsset(currentAsset), getPreviousAsset(currentAsset)]);
    assetCursor = {
      current: currentAsset,
      nextAsset,
      previousAsset,
    };
  };

  //TODO: replace this with async derived in svelte 6
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    $viewingAsset;
    untrack(() => void loadCloseAssets($viewingAsset));
  });

  const handleNavigateToAsset = async (targetAsset: AssetResponseDto | undefined) => {
    if (!targetAsset) {
      return false;
    }
    let waitForAssetViewerFree = new Promise<void>((resolve) => {
      eventManager.once('AssetViewerFree', () => resolve());
    });
    await navigate({ targetRoute: 'current', assetId: targetAsset.id });
    await waitForAssetViewerFree;
    return true;
  };

  const handleRandom = async () => {
    const randomAsset = await timelineManager.getRandomAsset();
    if (randomAsset) {
      await navigate({ targetRoute: 'current', assetId: randomAsset.id });
      return { id: randomAsset.id };
    }
  };

  const handleClose = async (asset: { id: string }) => {
    assetViewingStore.showAssetViewer(false);
    invisible = true;
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  const handlePreAction = async (action: Action) => {
    switch (action.type) {
      case removeAction:
      case AssetAction.TRASH:
      case AssetAction.RESTORE:
      case AssetAction.DELETE:
      case AssetAction.ARCHIVE:
      case AssetAction.SET_VISIBILITY_LOCKED:
      case AssetAction.SET_VISIBILITY_TIMELINE: {
        // find the next asset to show or close the viewer
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (await handleNavigateToAsset(assetCursor?.nextAsset)) ||
          (await handleNavigateToAsset(assetCursor?.previousAsset)) ||
          (await handleClose(action.asset));

        // delete after find the next one
        timelineManager.removeAssets([action.asset.id]);
        break;
      }
    }
  };
  const handleAction = (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.UNARCHIVE:
      case AssetAction.FAVORITE:
      case AssetAction.UNFAVORITE:
      case AssetAction.ADD: {
        timelineManager.upsertAssets([action.asset]);
        break;
      }

      case AssetAction.STACK: {
        updateStackedAssetInTimeline(timelineManager, {
          stack: action.stack,
          toDeleteIds: action.stack.assets
            .filter((asset) => asset.id !== action.stack.primaryAssetId)
            .map((asset) => asset.id),
        });
        break;
      }

      case AssetAction.UNSTACK: {
        updateUnstackedAssetInTimeline(timelineManager, action.assets);
        break;
      }
      case AssetAction.REMOVE_ASSET_FROM_STACK: {
        timelineManager.upsertAssets([toTimelineAsset(action.asset)]);
        if (action.stack) {
          //Have to unstack then restack assets in timeline in order to update the stack count in the timeline.
          updateUnstackedAssetInTimeline(
            timelineManager,
            action.stack.assets.map((asset) => toTimelineAsset(asset)),
          );
          updateStackedAssetInTimeline(timelineManager, {
            stack: action.stack,
            toDeleteIds: action.stack.assets
              .filter((asset) => asset.id !== action.stack?.primaryAssetId)
              .map((asset) => asset.id),
          });
        }
        break;
      }
      case AssetAction.SET_STACK_PRIMARY_ASSET: {
        //Have to unstack then restack assets in timeline in order for the currently removed new primary asset to be made visible.
        updateUnstackedAssetInTimeline(
          timelineManager,
          action.stack.assets.map((asset) => toTimelineAsset(asset)),
        );
        updateStackedAssetInTimeline(timelineManager, {
          stack: action.stack,
          toDeleteIds: action.stack.assets
            .filter((asset) => asset.id !== action.stack.primaryAssetId)
            .map((asset) => asset.id),
        });
        break;
      }
    }
  };
</script>

{#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    {withStacked}
    asset={assetCursor.current}
    nextAsset={assetCursor.nextAsset}
    previousAsset={assetCursor.previousAsset}
    {isShared}
    {album}
    {person}
    preAction={handlePreAction}
    onAction={handleAction}
    onNavigateToAsset={handleNavigateToAsset}
    onRandom={handleRandom}
    onClose={handleClose}
  />
{/await}
