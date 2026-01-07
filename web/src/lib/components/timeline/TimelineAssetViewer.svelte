<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import { AssetAction } from '$lib/constants';

  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { handlePromiseError } from '$lib/utils';
  import { updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AlbumResponseDto, type AssetResponseDto, type PersonResponseDto, getAssetInfo } from '@immich/sdk';
  import { onMount, untrack } from 'svelte';

  let { asset: viewingAsset, gridScrollTarget } = assetViewingStore;

  interface Props {
    timelineManager: TimelineManager;
    invisible: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto;
    person?: PersonResponseDto;

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
    album,
    person,
  }: Props = $props();

  const getNextAsset = async (currentAsset: AssetResponseDto, preload: boolean = true) => {
    const earlierTimelineAsset = await timelineManager.getEarlierAsset(currentAsset);
    if (earlierTimelineAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: earlierTimelineAsset.id });
      if (preload) {
        // also pre-cache an extra one, to pre-cache these assetInfos for the next nav after this one is complete
        void getNextAsset(asset, false);
      }
      return asset;
    }
  };

  const getPreviousAsset = async (currentAsset: AssetResponseDto, preload: boolean = true) => {
    const laterTimelineAsset = await timelineManager.getLaterAsset(currentAsset);

    if (laterTimelineAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: laterTimelineAsset.id });
      if (preload) {
        // also pre-cache an extra one, to pre-cache these assetInfos for the next nav after this one is complete
        void getPreviousAsset(asset, false);
      }
      return asset;
    }
  };

  let assetCursor = $state<AssetCursor>({
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
    untrack(() => handlePromiseError(loadCloseAssets($viewingAsset)));
  });

  const handleNavigateToAsset = async (targetAsset: AssetResponseDto | undefined | null) => {
    if (!targetAsset) {
      return false;
    }

    await navigate({ targetRoute: 'current', assetId: targetAsset.id });
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
  const handleUndoDelete = async (assets: TimelineAsset[]) => {
    timelineManager.upsertAssets(assets);
    if (assets.length > 0) {
      const restoredAsset = assets[0];
      const asset = await getAssetInfo({ ...authManager.params, id: restoredAsset.id });
      assetViewingStore.setAsset(asset);
      await navigate({ targetRoute: 'current', assetId: restoredAsset.id });
    }
  };
  const onAssetUpdate = ({ asset }: { event: 'upload' | 'update'; asset: AssetResponseDto }) => {
    if (asset.id === assetCursor.current.id) {
      void loadCloseAssets(asset);
    }
  };
  onMount(() => {
    const unsubscribes = [
      websocketEvents.on('on_upload_success', (asset: AssetResponseDto) => onAssetUpdate({ event: 'upload', asset })),
      websocketEvents.on('on_asset_update', (asset: AssetResponseDto) => onAssetUpdate({ event: 'update', asset })),
    ];
    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  });
</script>

{#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    {withStacked}
    cursor={assetCursor}
    {isShared}
    {album}
    {person}
    preAction={handlePreAction}
    onAction={handleAction}
    onUndoDelete={handleUndoDelete}
    onPrevious={() => handleNavigateToAsset(assetCursor.previousAsset)}
    onNext={() => handleNavigateToAsset(assetCursor.nextAsset)}
    onRandom={handleRandom}
    onClose={handleClose}
  />
{/await}
