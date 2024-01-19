<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiArchiveArrowUpOutline, mdiArchiveArrowDownOutline, mdiTimerSand } from '@mdi/js';
  import { archiveAssets, type OnArchive } from '$lib/utils/actions';
  import { isAllArchived } from '$lib/stores/asset-interaction.store';

  export let onArchive: OnArchive | undefined = undefined;

  export let menuItem = false;

  $: text = $isAllArchived ? 'Unarchive' : 'Archive';
  $: icon = $isAllArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleArchive = async () => {
    const isArchived = !$isAllArchived;
    loading = true;

    const assets = Array.from(getOwnedAssets()).filter((asset) => asset.isArchived !== isArchived);
    if (await archiveAssets(isArchived, onArchive, assets)) {
      clearSelect();
    }
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} on:click={handleArchive} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleArchive} />
  {/if}
{/if}
