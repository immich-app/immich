<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';

  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { downloadArchive, downloadFile } from '$lib/utils/asset-utils';
  import { getAssetInfo } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiDownload } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

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
      let asset = await getAssetInfo({ ...authManager.params, id: assets[0].id });
      await downloadFile(asset);
      return;
    }

    clearSelect();
    await downloadArchive(filename, { assetIds: assets.map((asset) => asset.id) });
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: handleDownloadFiles }} />

{#if menuItem}
  <MenuOption text={$t('download')} icon={mdiDownload} onClick={handleDownloadFiles} />
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('download')}
    icon={mdiDownload}
    onclick={handleDownloadFiles}
  />
{/if}
