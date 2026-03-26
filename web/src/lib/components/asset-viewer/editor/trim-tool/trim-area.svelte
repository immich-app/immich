<script lang="ts">
  import { trimManager } from '$lib/managers/edit/trim-manager.svelte';
  import { getAssetPlaybackUrl } from '$lib/utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import TrimTimeline from './trim-timeline.svelte';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  let videoElement = $state<HTMLVideoElement>();

  // Pass video element to TrimManager when it mounts
  $effect(() => {
    trimManager.setVideoElement(videoElement);
    return () => trimManager.setVideoElement(undefined);
  });

  let videoSrc = $derived(getAssetPlaybackUrl({ id: asset.id, cacheKey: asset.thumbhash }));
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
  <!-- Video player (no native controls — TrimTimeline handles playback) -->
  <div class="relative flex-1 flex items-center justify-center w-full min-h-0">
    <video
      bind:this={videoElement}
      src={videoSrc}
      class="max-h-full max-w-full rounded-lg"
      preload="metadata"
      playsinline
    >
      <track kind="captions" />
    </video>
  </div>

  <!-- Trim timeline below the video -->
  <div class="w-full max-w-3xl pb-2">
    <TrimTimeline {trimManager} />
  </div>
</div>
