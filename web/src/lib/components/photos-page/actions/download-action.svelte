<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { downloadArchive, downloadFile } from '$lib/utils/asset-utils';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { shortcut } from '$lib/actions/shortcut';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiCloudDownloadOutline, mdiFileDownloadOutline, mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    filename?: string;
    menuItem?: boolean;
  }

  let { filename = 'immich.zip', menuItem = false }: Props = $props();

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

  let menuItemIcon = $derived(getAssets().length === 1 ? mdiFileDownloadOutline : mdiFolderDownloadOutline);
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: handleDownloadFiles }} />

{#if menuItem}
  <MenuOption text={$t('download')} icon={menuItemIcon} onClick={handleDownloadFiles} />
{:else}
  <CircleIconButton title={$t('download')} icon={mdiCloudDownloadOutline} onclick={handleDownloadFiles} />
{/if}
