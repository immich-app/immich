<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
  import { downloadFile } from '$lib/utils/asset-utils';
  import { getAssetInfo } from '@immich/sdk';
  import { mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: TimelineAsset;
    menuItem?: boolean;
  }

  let { asset, menuItem = false }: Props = $props();

  const onDownloadFile = async () => downloadFile(await getAssetInfo({ id: asset.id, key: authManager.key }));
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: onDownloadFile }} />

{#if !menuItem}
  <CircleIconButton color="opaque" icon={mdiFolderDownloadOutline} title={$t('download')} onclick={onDownloadFile} />
{:else}
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={onDownloadFile} />
{/if}
