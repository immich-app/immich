<script lang="ts">
  import { assetViewerFadeDuration } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getAssetMediaUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize } from '@immich/sdk';
  import DelayedLoadingSpinner from '$lib/components/DelayedLoadingSpinner.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: TimelineAsset;
    onImageLoad: () => void;
  }

  const { asset, onImageLoad }: Props = $props();

  let assetFileUrl: string = $state('');
  let imageLoaded: boolean = $state(false);
  let loader = $state<HTMLImageElement>();

  const onLoadCallback = () => {
    imageLoaded = true;
    assetFileUrl = imageLoaderUrl;
    onImageLoad();
  };

  onMount(() => {
    if (loader?.complete) {
      onLoadCallback();
    }
    loader?.addEventListener('load', onLoadCallback);
    return () => {
      loader?.removeEventListener('load', onLoadCallback);
    };
  });

  const imageLoaderUrl = $derived(getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview }));
</script>

{#if !imageLoaded}
  <!-- svelte-ignore a11y_missing_attribute -->
  <img bind:this={loader} style="display:none" src={imageLoaderUrl} aria-hidden="true" />
{/if}

{#if !imageLoaded}
  <DelayedLoadingSpinner />
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
