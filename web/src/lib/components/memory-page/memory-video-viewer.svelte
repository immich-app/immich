<script lang="ts">
  import { assetViewerFadeDuration } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { autoPlayVideo } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import 'media-chrome/media-controller';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: TimelineAsset;
    videoPlayer: HTMLVideoElement | undefined;
  }

  let { asset, videoPlayer = $bindable() }: Props = $props();

  let showVideo: boolean = $state(false);

  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });
</script>

{#if showVideo}
  <div class="h-full w-full bg-pink-9000" transition:fade={{ duration: assetViewerFadeDuration }}>
    <media-controller nohotkeys class="h-full w-full rounded-2xl object-contain transition-all">
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        bind:this={videoPlayer}
        slot="media"
        autoplay={$autoPlayVideo}
        playsinline
        disablepictureinpicture
        class="h-full w-full"
        src={getAssetPlaybackUrl({ id: asset.id })}
        poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview })}
        draggable="false"
      ></video>
    </media-controller>
  </div>
{/if}
