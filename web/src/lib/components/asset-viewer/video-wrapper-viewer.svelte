<script lang="ts">
  import { AssetTypeEnum } from '@immich/sdk';
  import { ProjectionType } from '$lib/constants';
  import VideoNativeViewer from '$lib/components/asset-viewer/video-native-viewer.svelte';
  import PanoramaViewer from '$lib/components/asset-viewer/panorama-viewer.svelte';

  export let assetId: string;
  export let projectionType: string | null | undefined;
</script>

{#if projectionType === ProjectionType.EQUIRECTANGULAR}
  <PanoramaViewer asset={{ id: assetId, type: AssetTypeEnum.Video }} />
{:else}
  <VideoNativeViewer {assetId} on:onVideoEnded on:onVideoStarted />
{/if}
