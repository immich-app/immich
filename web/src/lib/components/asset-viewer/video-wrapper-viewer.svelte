<script lang="ts">
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-viewer/video-native-viewer.svelte';
  import { ProjectionType } from '$lib/constants';

  interface Props {
    assetId: string;
    projectionType: string | null | undefined;
    cacheKey: string | null;
    loopVideo: boolean;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onControlsChange?: ({ controlsVisible }: { controlsVisible: boolean }) => void;
  }

  let {
    assetId,
    projectionType,
    cacheKey,
    loopVideo,
    onPreviousAsset,
    onNextAsset,
    onVideoEnded,
    onVideoStarted,
    onControlsChange,
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {assetId} />
{:else}
  <VideoNativeViewer
    {loopVideo}
    {cacheKey}
    {assetId}
    {onPreviousAsset}
    {onNextAsset}
    {onVideoEnded}
    {onVideoStarted}
    {onControlsChange}
  />
{/if}
