<script lang="ts">
  import AdaptiveImage from '$lib/components/AdaptiveImage.svelte';
  import type { Size } from '$lib/utils/container-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import DelayedLoadingSpinner from '$lib/components/DelayedLoadingSpinner.svelte';

  interface Props {
    asset: AssetResponseDto;
    transitionName?: string;
    onImageLoad: () => void;
    onError?: () => void;
  }

  const { asset, transitionName, onImageLoad, onError }: Props = $props();

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  const container: Size = $derived({ width: containerWidth, height: containerHeight });
</script>

<div
  class="relative h-full w-full overflow-hidden"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  {#if containerWidth > 0 && containerHeight > 0}
    <AdaptiveImage {asset} {container} {transitionName} showLetterboxes={false} onImageReady={onImageLoad} {onError} />
  {:else}
    <DelayedLoadingSpinner />
  {/if}
</div>
