<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { downloadArchive, downloadFile } from '$lib/utils/asset-utils';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiCloudDownloadOutline, mdiFileDownloadOutline, mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

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

  $: menuItemIcon = getAssets().size === 1 ? mdiFileDownloadOutline : mdiFolderDownloadOutline;
</script>

{#if menuItem}
  <MenuOption text={$t('download')} icon={menuItemIcon} on:click={handleDownloadFiles} />
{:else}
  <CircleIconButton title={$t('download')} icon={mdiCloudDownloadOutline} on:click={handleDownloadFiles} />
{/if}
