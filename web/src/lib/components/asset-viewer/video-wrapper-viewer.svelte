<script lang="ts">
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import VideoPanoramaViewer from '$lib/components/asset-viewer/video-panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import type { AssetManager } from '$lib/managers/asset-manager/asset-manager.svelte';

  interface Props {
    assetManager: AssetManager;
    projectionType: string | null | undefined;
    loopVideo: boolean;
    onClose?: () => void;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
  }

  // TODO: do not preload assets.
  let {
    assetManager = $bindable(),
    projectionType,
    loopVideo,
    onPreviousAsset,
    onClose,
    onNextAsset,
    onVideoEnded,
    onVideoStarted,
  }: Props = $props();
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <VideoPanoramaViewer {assetManager} />
{:else}
  <VideoNativeViewer
    {loopVideo}
    {assetManager}
    {onPreviousAsset}
    {onNextAsset}
    {onVideoEnded}
    {onVideoStarted}
    {onClose}
  />
{/if}
