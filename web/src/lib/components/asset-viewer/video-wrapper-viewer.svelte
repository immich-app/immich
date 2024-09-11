<script lang="ts">
  import { AssetTypeEnum } from '@immich/sdk';
  import { ProjectionType } from '$lib/constants';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import PanoramaViewer from '$lib/components/asset-viewer/panorama-viewer.svelte';

  export let assetId: string;
  export let projectionType: string | null | undefined;
  export let checksum: string;
  export let loopVideo: boolean;
  export let onPreviousAsset: () => void;
  export let onNextAsset: () => void;
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
    on:onVideoEnded
    on:onVideoStarted
  />
{/if}
