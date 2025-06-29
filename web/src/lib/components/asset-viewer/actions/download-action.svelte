<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import type { AssetManager } from '$lib/managers/asset-manager/asset-manager.svelte';
  import { downloadFile } from '$lib/utils/asset-utils';
  import { IconButton } from '@immich/ui';
  import { mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    assetManager: AssetManager;
    menuItem?: boolean;
  }

  let { assetManager = $bindable(), menuItem = false }: Props = $props();

  const onDownloadFile = async () => downloadFile(assetManager.asset);
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: onDownloadFile }} />

{#if !menuItem}
  <IconButton
    color="secondary"
    shape="round"
    variant="ghost"
    icon={mdiFolderDownloadOutline}
    aria-label={$t('download')}
    onclick={onDownloadFile}
  />
{:else}
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={onDownloadFile} />
{/if}
