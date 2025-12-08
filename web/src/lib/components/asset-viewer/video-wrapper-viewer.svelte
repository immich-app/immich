<script lang="ts">
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import type { SharedLinkResponseDto } from '@immich/sdk';

  interface Props {
    transitionName?: string;
    cursor: AssetCursor;
    assetId?: string;
    sharedLink?: SharedLinkResponseDto;
    projectionType: string | null | undefined;
    cacheKey: string | null;
    loopVideo: boolean;
    playOriginalVideo: boolean;
    onClose?: () => void;
    onSwipe?: (direction: 'left' | 'right') => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onReady?: () => void;
  }

  let {
    transitionName,
    cursor,
    assetId,
    sharedLink,
    projectionType,
    cacheKey,
    loopVideo,
    playOriginalVideo,
    onSwipe,
    onClose,
    onVideoEnded,
    onVideoStarted,
    onReady,
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {transitionName} asset={cursor.current} {onReady} />
{:else}
  <VideoNativeViewer
    {transitionName}
    {loopVideo}
    {cacheKey}
    {cursor}
    {assetId}
    {sharedLink}
    {playOriginalVideo}
    {onSwipe}
    {onVideoEnded}
    {onVideoStarted}
    {onClose}
    {onReady}
  />
{/if}
