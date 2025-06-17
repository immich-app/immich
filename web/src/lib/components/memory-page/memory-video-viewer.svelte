<script lang="ts">
  import { assetViewerFadeDuration } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: TimelineAsset;
    videoPlayer: HTMLVideoElement | undefined;
    videoViewerMuted?: boolean;
    videoViewerVolume?: number;
  }

  let { asset, videoPlayer = $bindable(), videoViewerVolume, videoViewerMuted }: Props = $props();

  let showVideo: boolean = $state(false);

  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });
</script>

{#if showVideo}
  <div class="h-full w-full bg-pink-9000" transition:fade={{ duration: assetViewerFadeDuration }}>
    <video
      bind:this={videoPlayer}
      autoplay
      playsinline
      class="h-full w-full rounded-2xl object-contain transition-all"
      src={getAssetPlaybackUrl({ id: asset.id })}
      poster={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Preview })}
      draggable="false"
      muted={videoViewerMuted}
      volume={videoViewerVolume}
    ></video>
  </div>
{/if}
