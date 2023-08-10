<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import HeartMinusOutline from 'svelte-material-icons/HeartMinusOutline.svelte';
  import HeartOutline from 'svelte-material-icons/HeartOutline.svelte';
  import TimerSand from 'svelte-material-icons/TimerSand.svelte';
  import { OnFavorite, getAssetControlContext } from '../asset-select-control-bar.svelte';

  export let onFavorite: OnFavorite | undefined = undefined;

  export let menuItem = false;
  export let removeFavorite: boolean;

  $: text = removeFavorite ? 'Remove from Favorites' : 'Favorite';
  $: logo = removeFavorite ? HeartMinusOutline : HeartOutline;

  let loading = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleFavorite = async () => {
    const isFavorite = !removeFavorite;
    loading = true;

    try {
      const assets = Array.from(getAssets()).filter((asset) => asset.isFavorite !== isFavorite);
      const ids = assets.map(({ id }) => id);

      if (ids.length > 0) {
        await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });
      }

      for (const asset of assets) {
        asset.isFavorite = isFavorite;
      }

      onFavorite?.(ids, isFavorite);

      notificationController.show({
        message: isFavorite ? `Added ${ids.length} to favorites` : `Removed ${ids.length} from favorites`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, `Unable to ${isFavorite ? 'add to' : 'remove from'} favorites`);
    } finally {
      loading = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption {text} on:click={handleFavorite} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" logo={TimerSand} />
  {:else}
    <CircleIconButton title={text} {logo} on:click={handleFavorite} />
  {/if}
{/if}
