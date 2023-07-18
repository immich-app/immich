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
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">Select feature photo</svelte:fragment>
  </ControlAppBar>
  <section class="bg-immich-bg pl-[70px] pt-[100px] dark:bg-immich-dark-bg">
    <AssetSelectionViewer {assets} on:select={handleSelectedAsset} />
  </section>
</section>
