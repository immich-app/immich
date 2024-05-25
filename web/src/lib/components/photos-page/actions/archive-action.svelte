<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { archiveAssets, type OnArchive } from '$lib/utils/actions';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';

  export let onArchive: OnArchive;

  export let menuItem = false;
  export let unarchive = false;

  $: text = unarchive ? 'Unarchive' : 'Archive';
  $: icon = unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleArchive = async () => {
    const isArchived = !unarchive;
    loading = true;
    const assets = [...getOwnedAssets()].filter((asset) => asset.isArchived !== isArchived);
    const ids = assets.map(({ id }) => id);
    await archiveAssets(isArchived, onArchive, ids);
    clearSelect();
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} on:click={handleArchive} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleArchive} />
  {/if}
{/if}
