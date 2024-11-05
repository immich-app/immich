<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { downloadFile } from '$lib/utils/asset-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    menuItem?: boolean;
  }

  let { asset, menuItem = false }: Props = $props();

  const onDownloadFile = () => downloadFile(asset);
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: onDownloadFile }} />

{#if !menuItem}
  <CircleIconButton color="opaque" icon={mdiFolderDownloadOutline} title={$t('download')} onclick={onDownloadFile} />
{:else}
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={onDownloadFile} />
{/if}
