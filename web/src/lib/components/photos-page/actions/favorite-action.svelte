<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import type { OnFavorite } from '$lib/utils/actions';

  export let onFavorite: OnFavorite | undefined = undefined;

  export let menuItem = false;
  export let removeFavorite: boolean;

  $: text = removeFavorite ? 'Retirer des favoris' : 'Favoris';
  $: icon = removeFavorite ? mdiHeartMinusOutline : mdiHeartOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleFavorite = async () => {
    const isFavorite = !removeFavorite;
    loading = true;

    try {
      const assets = [...getOwnedAssets()].filter((asset) => asset.isFavorite !== isFavorite);

      const ids = assets.map(({ id }) => id);

      if (ids.length > 0) {
        await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });
      }

      for (const asset of assets) {
        asset.isFavorite = isFavorite;
      }

      onFavorite?.(ids, isFavorite);

      notificationController.show({
        message: isFavorite ? `Ajouté ${ids.length} aux favoris` : `Retiré ${ids.length} des favoris`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, `Impossible ${isFavorite ? "d'ajouter aux" : 'de retirer des'} favoris`);
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
    <CircleIconButton title="Chargement" icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleFavorite} />
  {/if}
{/if}
