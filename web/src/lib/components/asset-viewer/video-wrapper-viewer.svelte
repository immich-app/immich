<script lang="ts">
  import { AssetTypeEnum } from '@immich/sdk';
  import { ProjectionType } from '$lib/constants';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import PanoramaViewer from '$lib/components/asset-viewer/panorama-viewer.svelte';

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
  <PanoramaViewer asset={{ id: assetId, type: AssetTypeEnum.Video }} />
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
