<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { OnArchive } from '$lib/utils/actions';
  import { archiveAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    onArchive?: OnArchive;
    menuItem?: boolean;
    unarchive?: boolean;
  }

  let { onArchive, menuItem = false, unarchive = false }: Props = $props();

  let text = $derived(unarchive ? $t('unarchive') : $t('to_archive'));
  let icon = $derived(unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline);

  let loading = $state(false);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleArchive = async () => {
    const isArchived = unarchive ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const assets = [...getOwnedAssets()].filter((asset) => asset.visibility !== isArchived);
    loading = true;
    const ids = await archiveAssets(assets, isArchived as AssetVisibility);
    if (ids) {
      onArchive?.(ids, isArchived ? AssetVisibility.Archive : AssetVisibility.Timeline);
      clearSelect();
    }
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleArchive} />
{/if}

{#if !menuItem}
  {#if loading}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      aria-label={$t('loading')}
      icon={mdiTimerSand}
      onclick={() => {}}
    />
  {:else}
    <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={handleArchive} />
  {/if}
{/if}
