<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { OnArchive } from '$lib/utils/actions';
  import { archiveAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onArchive?: OnArchive;
    menuItem?: boolean;
    unarchive?: boolean;
  };

  let { onArchive, menuItem = false, unarchive = false }: Props = $props();

  let text = $derived(unarchive ? $t('unarchive') : $t('to_archive'));
  let icon = $derived(unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline);

  let loading = $state(false);

  const handleArchive = async () => {
    const visibility = unarchive ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const assets = assetMultiSelectManager.getOwnedAssets().filter((asset) => asset.visibility !== visibility);
    loading = true;
    const ids = await archiveAssets(assets, visibility as AssetVisibility);
    if (ids) {
      onArchive?.(ids, visibility);
      assetMultiSelectManager.clear();
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
