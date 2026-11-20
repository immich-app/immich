<script lang="ts">
  import AssetViewerEvents from '#lib/components/AssetViewerEvents.svelte';
  import OnEvents from '#lib/components/OnEvents.svelte';
  import type { AssetCursor } from '#lib/components/asset-viewer/AssetViewer.svelte';
  import { assetCacheManager } from '#lib/managers/AssetCacheManager.svelte.ts';
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
  import { websocketEvents } from '#lib/stores/websocket.ts';
  import { handlePromiseError } from '#lib/utils.ts';
  import { navigateToAsset } from '#lib/utils/asset-utils.ts';
  import { handleErrorAsync } from '#lib/utils/handle-error.ts';
  import { navigate } from '#lib/utils/navigation.ts';
  import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
  import { AssetVisibility, type AlbumResponseDto, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    timelineManager: TimelineManager;
    invisible: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto;
    person?: PersonResponseDto;
  }

  let {
    timelineManager,

    invisible = $bindable(false),
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
    current: assetViewerManager.asset!,
    previousAsset: undefined,
    nextAsset: undefined,
  });

  const loadCloseAssets = async (currentAsset: AssetResponseDto) => {
    const [nextAsset, previousAsset] = await Promise.all([getNextAsset(currentAsset), getPreviousAsset(currentAsset)]);
    const hasLeftTimeline =
      assetCursor.current.id === currentAsset.id && !timelineManager.getTimelineMonthByAssetId(currentAsset.id);

    assetCursor = hasLeftTimeline
      ? { ...assetCursor, current: currentAsset }
      : { current: currentAsset, nextAsset, previousAsset };
  };

  //TODO: replace this with async derived in svelte 6
  $effect(() => {
    const asset = assetViewerManager.asset;
    void timelineManager.assetCount;
    if (asset) {
      untrack(() => handlePromiseError(loadCloseAssets(asset)));
    }
  });

  const handleRandom = async () => {
    const randomAsset = await timelineManager.getRandomAsset();
    if (!randomAsset) {
      return;
    }

    await navigate({ targetRoute: 'current', assetId: randomAsset.id });
    return { id: randomAsset.id };
  };

  const handleClose = async (assetId: string) => {
    invisible = true;
    assetViewerManager.gridScrollTarget = { at: assetId };
    await navigate({
      targetRoute: 'current',
      assetId: null,
      assetGridRouteSearchParams: assetViewerManager.gridScrollTarget,
    });
  };

  const showNextOrClose = async (assetId: string) => {
    if ((await navigateToAsset(assetCursor?.nextAsset)) || (await navigateToAsset(assetCursor?.previousAsset))) {
      return;
    }

    await handleClose(assetId);
  };

  const onAlbumRemoveAssets = async ({ assetIds, albumIds }: { assetIds: string[]; albumIds: string[] }) => {
    if (!!album && albumIds.includes(album.id) && assetIds.includes(assetCursor.current.id)) {
      await showNextOrClose(assetCursor.current.id);
    }
  };

  const onAssetLeave = async ({ asset, reason }: { asset: AssetResponseDto; reason: string }) => {
    if (reason === 'archive') {
      timelineManager.update([asset.id], (timelineAsset) => (timelineAsset.visibility = AssetVisibility.Archive));
    } else {
      timelineManager.removeAssets([asset.id]);
    }
    await showNextOrClose(asset.id);
  };

  const invalidateAssetCache = () => assetCacheManager.invalidate();

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

<OnEvents {onAlbumRemoveAssets} onAssetsDelete={invalidateAssetCache} onAssetsRestore={invalidateAssetCache} />
<AssetViewerEvents {onAssetLeave} />

{#await import('#lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    {withStacked}
    cursor={assetCursor}
    {isShared}
    {album}
    {person}
    onAssetChange={(asset) => {
      timelineManager?.upsertAssets([toTimelineAsset(asset)]);
    }}
    onRandom={handleRandom}
    onClose={handleClose}
  />
{/await}
