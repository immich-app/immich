<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { downloadArchive, downloadFile } from '$lib/utils/asset-utils';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiCloudDownloadOutline } from '@mdi/js';

  export let filename = 'immich.zip';
  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleDownloadFiles = async () => {
    const assets = [...getAssets()];
    if (assets.length === 1) {
      clearSelect();
      await downloadFile(assets[0]);
      return;
    }

    clearSelect();
    await downloadArchive(filename, { assetIds: assets.map((asset) => asset.id) });
  };
</script>

{#if menuItem}
  <MenuOption text="Download" on:click={handleDownloadFiles} />
{:else}
  <CircleIconButton title="Download" icon={mdiCloudDownloadOutline} on:click={handleDownloadFiles} />
{/if}
