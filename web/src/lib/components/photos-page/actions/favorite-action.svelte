<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import { favoriteAssets, type OnFavorite } from '$lib/utils/actions';
  import { isAllFavorite } from '$lib/stores/asset-interaction.store';

  export let onFavorite: OnFavorite | undefined = undefined;

  export let menuItem = false;

  $: text = $isAllFavorite ? 'Remove from Favorites' : 'Favorite';
  $: icon = $isAllFavorite ? mdiHeartMinusOutline : mdiHeartOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleFavorite = async () => {
    const isFavorite = !$isAllFavorite;
    loading = true;

    const assets = Array.from(getOwnedAssets()).filter((asset) => asset.isFavorite !== isFavorite);

    if (await favoriteAssets(isFavorite, onFavorite, assets)) {
      clearSelect();
    }

    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} on:click={handleFavorite} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleFavorite} />
  {/if}
{/if}
