<script lang="ts">
  import { assetInteractionStore, assetsInAlbumStoreState, selectedAssets } from '$lib/stores/asset-interaction.store';
  import { locale } from '$lib/stores/preferences.store';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AssetResponseDto } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Button from '../elements/buttons/button.svelte';
  import AssetGrid from '../photos-page/asset-grid.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  const dispatch = createEventDispatcher();

  export let albumId: string;
  export let assetsInAlbum: AssetResponseDto[];

  onMount(() => {
    $assetsInAlbumStoreState = assetsInAlbum;
  });

  const addSelectedAssets = async () => {
    dispatch('create-album', {
      assets: Array.from($selectedAssets),
    });

    assetInteractionStore.clearMultiselect();
  };
  const handleSelectFromComputerClicked = async () => {
    await openFileUploadDialog(albumId, '');
    assetInteractionStore.clearMultiselect();
    dispatch('go-back');
  };
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <ControlAppBar
    on:close-button-click={() => {
      assetInteractionStore.clearMultiselect();
      dispatch('go-back');
    }}
  >
    <svelte:fragment slot="leading">
      {#if $selectedAssets.size == 0}
        <p class="text-lg dark:text-immich-dark-fg">Add to album</p>
      {:else}
        <p class="text-lg dark:text-immich-dark-fg">
          {$selectedAssets.size.toLocaleString($locale)} selected
        </p>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="trailing">
      <button
        on:click={handleSelectFromComputerClicked}
        class="rounded-lg px-6 py-2 text-sm font-medium text-immich-primary transition-all hover:bg-immich-primary/10 dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/25"
      >
        Select from computer
      </button>
      <Button size="sm" rounded="lg" disabled={$selectedAssets.size === 0} on:click={addSelectedAssets}>Done</Button>
    </svelte:fragment>
  </ControlAppBar>
  <section class="grid h-screen bg-immich-bg pl-[70px] pt-[100px] dark:bg-immich-dark-bg">
    <AssetGrid isAlbumSelectionMode={true} />
  </section>
</section>
