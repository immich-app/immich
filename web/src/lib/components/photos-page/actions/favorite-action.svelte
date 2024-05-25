<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { favoriteAssets, type OnFavorite } from '$lib/utils/actions';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';

  export let onFavorite: OnFavorite;

  export let menuItem = false;
  export let removeFavorite: boolean;

  $: text = removeFavorite ? 'Remove from favorites' : 'Favorite';
  $: icon = removeFavorite ? mdiHeartMinusOutline : mdiHeartOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleFavorite = async () => {
    const isFavorite = !removeFavorite;
    loading = true;
    const assets = [...getOwnedAssets()].filter((asset) => asset.isFavorite !== isFavorite);
    await favoriteAssets(isFavorite, () => onFavorite(assets, isFavorite), assets);
    clearSelect();
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} on:click={handleFavorite} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleFavorite} />
  {/if}
{/if}
