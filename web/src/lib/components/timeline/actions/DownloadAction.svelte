<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';

  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleDownloadAsset } from '$lib/services/asset.service';
  import { downloadArchive } from '$lib/utils/asset-utils';
  import { getAssetInfo } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiDownload } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    filename?: string;
    menuItem?: boolean;
  }

  let { filename = 'immich.zip', menuItem = false }: Props = $props();

  const handleDownloadFiles = async () => {
    const assets = assetMultiSelectManager.assets;
    if (assets.length === 1) {
      assetMultiSelectManager.clear();
      let asset = await getAssetInfo({ ...authManager.params, id: assets[0].id });
      await handleDownloadAsset(asset, { edited: true });
      return;
    }

    assetMultiSelectManager.clear();
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
