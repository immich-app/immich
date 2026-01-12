<script lang="ts">
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import type { SharedLinkResponseDto } from '@immich/sdk';

  interface Props {
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
  }

  let {
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
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer asset={cursor.current} />
{:else}
  <VideoNativeViewer
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
  />
{/if}
