<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: TimelineAsset;
  }

  const { asset }: Props = $props();

  let assetFileUrl: string = $state('');
  let imageLoaded: boolean = $state(false);
  let loader = $state<HTMLImageElement>();

  const onload = () => {
    imageLoaded = true;
    assetFileUrl = imageLoaderUrl;
  };

  onMount(() => {
    if (loader?.complete) {
      onload();
    }
    loader?.addEventListener('load', onload);
    return () => {
      loader?.removeEventListener('load', onload);
    };
  });

  const imageLoaderUrl = $derived(getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Preview }));
</script>

{#if !imageLoaded}
  <!-- svelte-ignore a11y_missing_attribute -->
  <img bind:this={loader} style="display:none" src={imageLoaderUrl} aria-hidden="true" />
{/if}

{#if !imageLoaded}
  <div id="spinner" class="flex h-full items-center justify-center">
    <LoadingSpinner />
  </div>
{:else if imageLoaded}
  <div transition:fade={{ duration: assetViewerFadeDuration }} class="h-full w-full">
    <img
      class="h-full w-full rounded-2xl object-contain transition-all"
      src={assetFileUrl}
      alt={$getAltText(asset)}
      draggable="false"
    />
  </div>
{/if}

<style>
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  #spinner {
    visibility: hidden;
    animation: 0s linear 0.4s forwards delayedVisibility;
  }
</style>
