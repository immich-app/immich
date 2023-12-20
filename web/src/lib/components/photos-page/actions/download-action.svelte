<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { downloadArchive, downloadFile } from '$lib/utils/asset-utils';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiCloudDownloadOutline } from '@mdi/js';

  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  };

  const handleDownloadFiles = async () => {
    const assets = Array.from(getAssets());
    const filename = `immich-${formatDate()}.zip`;
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
