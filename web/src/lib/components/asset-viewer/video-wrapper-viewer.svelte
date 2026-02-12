<script lang="ts">
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import type { AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    assetId?: string;
    projectionType: string | null | undefined;
    cacheKey: string | null;
    loopVideo: boolean;
    playOriginalVideo: boolean;
    showFullscreen?: boolean;
    onClose?: () => void;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
  }

  let {
    asset,
    assetId,
    projectionType,
    cacheKey,
    loopVideo,
    playOriginalVideo,
    showFullscreen = true,
    onPreviousAsset,
    onClose,
    onNextAsset,
    onVideoEnded,
    onVideoStarted,
  }: Props = $props();

  const effectiveAssetId = $derived(assetId ?? asset.id);
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {asset} />
{:else}
  <VideoNativeViewer
    {loopVideo}
    {cacheKey}
    {asset}
    assetId={effectiveAssetId}
    {playOriginalVideo}
    {showFullscreen}
    {onPreviousAsset}
    {onNextAsset}
    {onVideoEnded}
    {onVideoStarted}
    {onClose}
  />
{/if}
