<script lang="ts">
  import { api } from '@api';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { videoViewerVolume } from '$lib/stores/preferences.store';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let assetId: string;
  export let publicSharedKey: string | undefined = undefined;

  let isVideoLoading = true;
  const dispatch = createEventDispatcher();

  const handleCanPlay = (ev: Event & { currentTarget: HTMLVideoElement }) => {
    const playerNode = ev.currentTarget;

    playerNode.muted = true;
    playerNode.play();
    playerNode.muted = false;

    isVideoLoading = false;
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex place-items-center place-content-center h-full select-none">
  <video
    controls
    class="h-full object-contain"
    on:canplay={handleCanPlay}
    on:ended={() => dispatch('onVideoEnded')}
    bind:volume={$videoViewerVolume}
  >
    <source src={api.getAssetFileUrl(assetId, false, true, publicSharedKey)} type="video/mp4" />
    <track kind="captions" />
  </video>

  {#if isVideoLoading}
    <div class="absolute flex place-items-center place-content-center">
      <LoadingSpinner />
    </div>
  {/if}
</div>
