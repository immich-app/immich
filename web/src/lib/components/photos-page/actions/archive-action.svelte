<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { OnArchive } from '$lib/utils/actions';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { archiveAssets } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';

  export let onArchive: OnArchive;

  export let menuItem = false;
  export let unarchive = false;

  $: text = unarchive ? $t('unarchive') : $t('to_archive');
  $: icon = unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline;

  let loading = false;

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
  <MenuOption {text} {icon} on:click={handleArchive} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleArchive} />
  {/if}
{/if}
