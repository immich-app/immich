<script lang="ts">
  import type { AssetResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import AssetSelectionViewer from '../shared-components/gallery-viewer/asset-selection-viewer.svelte';

  const dispatch = createEventDispatcher();

  export let assets: AssetResponseDto[];

  let selectedAsset: AssetResponseDto | undefined = undefined;

  const handleSelectedAsset = async (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    selectedAsset = asset;
    onClose();
  };

  const onClose = () => {
    dispatch('go-back', { selectedAsset });
  };
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">Select feature photo</svelte:fragment>
  </ControlAppBar>
  <section class="pt-[100px] pl-[70px] bg-immich-bg dark:bg-immich-dark-bg">
    <AssetSelectionViewer {assets} on:select={handleSelectedAsset} />
  </section>
</section>
