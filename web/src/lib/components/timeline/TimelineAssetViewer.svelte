<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import type { Something } from '$lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAssetInfo, type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';

  let { asset: viewingAsset, gridScrollTarget, mutex, preloadAssets } = assetViewingStore;

  interface Props {
    shared: Something;
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
    shared,
    timelineManager,
    invisible = $bindable(false),
    removeAction,
    withStacked = false,
    isShared = false,
    album = null,
    person = null,
  }: Props = $props();

  const handlePrevious = async () => {
    const release = await mutex.acquire();
    const laterAsset = await timelineManager.getLaterAsset($viewingAsset);

    if (laterAsset) {
      const preloadAsset = await timelineManager.getLaterAsset(laterAsset);
      const asset = await getAssetInfo({ ...authManager.params, id: laterAsset.id });
      assetViewingStore.setAsset(asset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: laterAsset.id });
    }

    release();
    return !!laterAsset;
  };

  const handleNext = async () => {
    const release = await mutex.acquire();
    const earlierAsset = await timelineManager.getEarlierAsset($viewingAsset);

    if (earlierAsset) {
      const preloadAsset = await timelineManager.getEarlierAsset(earlierAsset);
      const asset = await getAssetInfo({ ...authManager.params, id: earlierAsset.id });
      assetViewingStore.setAsset(asset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: earlierAsset.id });
    }

    release();
    return !!earlierAsset;
  };

  const handleRandom = async () => {
    const randomAsset = await timelineManager.getRandomAsset();

    if (randomAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: randomAsset.id });
      assetViewingStore.setAsset(asset);
      await navigate({ targetRoute: 'current', assetId: randomAsset.id });
      return asset;
    }
  };

  const handleClose = async (asset: { id: string }) => {
    const awaitInit = new Promise<void>((resolve) => eventManager.once('StartViewTransition', resolve));
    eventManager.emit('TransitionToTimeline', { id: asset.id });
    await awaitInit;

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
        (await handleNext()) || (await handlePrevious()) || (await handleClose(action.asset));

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
    {shared}
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
