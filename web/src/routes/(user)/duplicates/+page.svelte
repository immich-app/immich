<script lang="ts">
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import { getAssetDuplicates, type AssetResponseDto } from '@immich/sdk';
  import type { Viewport } from '$lib/stores/assets.store';
  import { onMount } from 'svelte';

  let assets: AssetResponseDto[] = [];
  const viewport: Viewport = { width: 0, height: 0 };

  onMount(async () => {
    assets = await getAssetDuplicates();
  });
</script>

<section
  class="relative mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
>
  <GalleryViewer {assets} {viewport}></GalleryViewer>
</section>
