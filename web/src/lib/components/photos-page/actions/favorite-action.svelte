<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import type { OnFavorite } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { t } from 'svelte-i18n';

  export let onFavorite: OnFavorite;

  export let menuItem = false;
  export let removeFavorite: boolean;

  $: text = removeFavorite ? $t('remove_from_favorites') : $t('to_favorite');
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
        await updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });
      }

      for (const asset of assets) {
        asset.isFavorite = isFavorite;
      }

      onFavorite(ids, isFavorite);

      notificationController.show({
        message: isFavorite
          ? $t('added_to_favorites_count', { values: { count: ids.length } })
          : $t('removed_from_favorites_count', { values: { count: ids.length } }),
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: isFavorite } }));
    } finally {
      loading = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleFavorite} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleFavorite} />
  {/if}
{/if}
