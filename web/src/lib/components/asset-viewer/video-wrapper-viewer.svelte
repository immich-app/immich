<script lang="ts">
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';

  interface Props {
    transitionName?: string | null;
    asset: AssetResponseDto;
    assetId: string;
    previousAsset?: AssetResponseDto | null | undefined;
    nextAsset?: AssetResponseDto | null | undefined;
    sharedLink?: SharedLinkResponseDto;
    projectionType: string | null | undefined;
    cacheKey: string | null;
    loopVideo: boolean;
    playOriginalVideo: boolean;
    onClose?: () => void;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
  }

  let {
    transitionName,
    asset,
    assetId,
    previousAsset,
    nextAsset,
    sharedLink,
    projectionType,
    cacheKey,
    loopVideo,
    playOriginalVideo,
    onPreviousAsset,
    onClose,
    onNextAsset,
    onVideoEnded,
    onVideoStarted,
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {assetId} {transitionName} />
{:else}
  <VideoNativeViewer
    {transitionName}
    {loopVideo}
    {cacheKey}
    {asset}
    {assetId}
    {nextAsset}
    {sharedLink}
    {previousAsset}
    {playOriginalVideo}
    {onPreviousAsset}
    {onNextAsset}
    {onVideoEnded}
    {onVideoStarted}
    {onClose}
  />
{/if}
