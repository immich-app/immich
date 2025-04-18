<script lang="ts">
  import { ProjectionType } from '$lib/constants';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';

  interface Props {
    assetId: string;
    projectionType: string | null | undefined;
    cacheKey: string | null;
    loopVideo: boolean;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
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
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {assetId} />
{:else}
  <VideoNativeViewer {loopVideo} {cacheKey} {assetId} {onPreviousAsset} {onNextAsset} {onVideoEnded} {onVideoStarted} />
{/if}
