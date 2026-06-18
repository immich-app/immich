<script lang="ts">
  import '$lib/components/asset-viewer/immich-video-element';
  import { assetViewerFadeDuration } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { autoPlayVideo } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import 'media-chrome/media-controller';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: TimelineAsset;
  }

  let { asset }: Props = $props();

  let showVideo = $state(false);
  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });
</script>

{#if showVideo}
  <div class="size-full" transition:fade={{ duration: assetViewerFadeDuration }}>
    <media-controller id="memory-video" nohotkeys class="size-full rounded-2xl object-contain transition-all">
      <immich-video
        slot="media"
        asset-id={asset.id}
        cache-key={asset.thumbhash ?? ''}
        class="size-full"
        draggable="false"
        autoplay={$autoPlayVideo}
        poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview })}
      ></immich-video>
    </media-controller>
  </div>
{/if}
