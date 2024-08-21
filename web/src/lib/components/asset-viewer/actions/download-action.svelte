<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { downloadFile } from '$lib/utils/asset-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiFolderDownloadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let menuItem = false;

  const onDownloadFile = () => downloadFile(asset);
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'd', shift: true }, onShortcut: onDownloadFile }} />

{#if !menuItem}
  <CircleIconButton color="opaque" icon={mdiFolderDownloadOutline} title={$t('download')} on:click={onDownloadFile} />
{:else}
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={onDownloadFile} />
{/if}
