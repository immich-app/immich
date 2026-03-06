<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import { AssetAction } from '$lib/constants';
  import { assetCacheManager } from '$lib/managers/AssetCacheManager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { handlePromiseError } from '$lib/utils';
  import { updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { navigateToAsset } from '$lib/utils/asset-utils';
  import { handleErrorAsync } from '$lib/utils/handle-error';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AlbumResponseDto, type AssetResponseDto, type PersonResponseDto, getAssetInfo } from '@immich/sdk';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  let { asset: viewingAsset, gridScrollTarget } = assetViewingStore;

  interface Props {
    timelineManager: TimelineManager;
    invisible: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto;
    person?: PersonResponseDto;
    removeAction?: AssetAction.UNARCHIVE | AssetAction.ARCHIVE | AssetAction.SET_VISIBILITY_TIMELINE | null;
  }

  let {
    timelineManager,
    // eslint-disable-next-line no-useless-assignment
    invisible = $bindable(false),
    removeAction,
    withStacked = false,
    isShared = false,
    album,
    person,
  }: Props = $props();

  const getAsset = (id: string) => {
    return handleErrorAsync(
      () => assetCacheManager.getAsset({ ...authManager.params, id }),
      $t('error_retrieving_asset_information'),
    );
  };

  const getNextAsset = async (currentAsset: AssetResponseDto) => {
    const earlierTimelineAsset = await timelineManager.getEarlierAsset(currentAsset);
    if (!earlierTimelineAsset) {
      return;
    }
    return getAsset(earlierTimelineAsset.id);
  };

  const getPreviousAsset = async (currentAsset: AssetResponseDto) => {
    const laterTimelineAsset = await timelineManager.getLaterAsset(currentAsset);
    if (!laterTimelineAsset) {
      return;
    }
    return getAsset(laterTimelineAsset.id);
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

  const handleRandom = async () => {
    const randomAsset = await timelineManager.getRandomAsset();
    if (!randomAsset) {
      return;
    }

    await navigate({ targetRoute: 'current', assetId: randomAsset.id });
    return { id: randomAsset.id };
  };

  const handleClose = async (asset: { id: string }) => {
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
        // must update manager before performing any navigation
        timelineManager.removeAssets([action.asset.id]);

        // find the next asset to show or close the viewer
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (await navigateToAsset(assetCursor?.nextAsset)) ||
          (await navigateToAsset(assetCursor?.previousAsset)) ||
          (await handleClose(action.asset));

        break;
      }
    }
  };
  const handleAction = (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.UNARCHIVE: {
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
    if (assets.length === 0) {
      return;
    }

    const restoredAsset = assets[0];
    const asset = await getAssetInfo({ ...authManager.params, id: restoredAsset.id });
    assetViewingStore.setAsset(asset);
    await navigate({ targetRoute: 'current', assetId: restoredAsset.id });
  };

  const handleUpdateOrUpload = (asset: AssetResponseDto) => {
    if (asset.id === assetCursor.current.id) {
      void loadCloseAssets(asset);
    }
  };

  onMount(() => {
    const unsubscribes = [
      websocketEvents.on('on_upload_success', (asset: AssetResponseDto) => handleUpdateOrUpload(asset)),
      websocketEvents.on('on_asset_update', (asset: AssetResponseDto) => handleUpdateOrUpload(asset)),
    ];
    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  });

  onDestroy(() => {
    assetCacheManager.invalidate();
  });
</script>

{#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    {withStacked}
    cursor={assetCursor}
    {isShared}
    {album}
    {person}
    onAssetChange={(asset) => {
      timelineManager?.upsertAssets([toTimelineAsset(asset)]);
    }}
    preAction={handlePreAction}
    onAction={(action) => {
      handleAction(action);
      assetCacheManager.invalidate();
    }}
    onUndoDelete={handleUndoDelete}
    onRandom={handleRandom}
    onClose={handleClose}
  />
{/await}
