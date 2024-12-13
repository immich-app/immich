<script lang="ts">
  import { ProjectionType } from '$lib/constants';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';

  interface Props {
    assetId: string;
    projectionType: string | null | undefined;
    checksum: string;
    loopVideo: boolean;
    onClose?: () => void;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
  }

  let {
    assetId,
    projectionType,
    checksum,
    loopVideo,
    onPreviousAsset,
    onClose,
    onNextAsset,
    onVideoEnded,
    onVideoStarted,
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {assetId} />
{:else}
  <VideoNativeViewer
    {loopVideo}
    {checksum}
    {assetId}
    {onPreviousAsset}
    {onNextAsset}
    {onVideoEnded}
    {onVideoStarted}
    {onClose}
  />
{/if}
