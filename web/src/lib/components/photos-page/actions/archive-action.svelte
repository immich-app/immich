<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { OnArchive } from '$lib/utils/actions';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { archiveAssets } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';

  interface Props {
    onArchive: OnArchive;
    menuItem?: boolean;
    unarchive?: boolean;
  }

  let { onArchive, menuItem = false, unarchive = false }: Props = $props();

  let text = $derived(unarchive ? $t('unarchive') : $t('to_archive'));
  let icon = $derived(unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline);

  let loading = $state(false);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleArchive = async () => {
    const isArchived = !unarchive;
    const assets = [...getOwnedAssets()].filter((asset) => asset.isArchived !== isArchived);
    loading = true;
    const ids = await archiveAssets(assets, isArchived);
    if (ids) {
      onArchive(ids, isArchived);
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
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} onclick={() => {}} />
  {:else}
    <CircleIconButton title={text} {icon} onclick={handleArchive} />
  {/if}
{/if}
