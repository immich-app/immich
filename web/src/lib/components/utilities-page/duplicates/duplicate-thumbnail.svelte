<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import type { DuplicateResponseDto } from '@immich/sdk';
  import { mdiImageMultipleOutline } from '@mdi/js';
  import { IsInViewport } from 'runed';

  interface Props {
    duplicate: DuplicateResponseDto;
    asPlaceholder?: boolean;
  }

  let { duplicate, asPlaceholder }: Props = $props();

  let imgElement = $state<HTMLImageElement | null>(null);
  const inViewport = new IsInViewport(() => imgElement, {
    rootMargin: '100px',
    threshold: 0.01,
  });

  let assetToDisplay = duplicate.assets[0];
  let title = $derived(`${assetToDisplay.originalFileName} duplicates`);
  let isImageLoading = $state(false);

  $effect(() => {
    if (asPlaceholder) {
      return;
    }

    // We only want to load the image if it's in the viewport
    // What isn't handled here, is that images will be fetched,
    // if they were in the viewport before, but are not anymore
    if (inViewport.current && !isImageLoading && imgElement) {
      // Set the src attribute to trigger the image fetch
      imgElement.src = getAssetThumbnailUrl(assetToDisplay.id);
      isImageLoading = true;
    }
  });
</script>

<a
  href="{AppRoute.DUPLICATES}/{duplicate.duplicateId}"
  class="block relative w-full rounded-xl outline outline-4 outline-transparent hover:outline-gray-300 dark:hover:outline-gray-700"
>
  {#if asPlaceholder}
    <div class="h-60 bg-gray-200 dark:bg-gray-800 rounded-xl w-full animate-pulse"></div>
  {:else}
    <img alt={title} {title} class="h-60 object-cover rounded-xl w-full" draggable="false" bind:this={imgElement} />
  {/if}

  <div class="absolute top-2 right-3">
    <div class="bg-immich-primary/90 px-2 py-1 my-0.5 rounded-xl text-xs text-white">
      <div class="flex items-center justify-center">
        <div class="mr-1">{duplicate.assets.length}</div>
        <Icon path={mdiImageMultipleOutline} size="18" />
      </div>
    </div>
  </div>
</a>
