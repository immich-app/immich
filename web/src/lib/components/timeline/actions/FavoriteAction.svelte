<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { OnFavorite } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onFavorite?: OnFavorite;
    menuItem?: boolean;
    removeFavorite: boolean;
  }

  let { onFavorite, menuItem = false, removeFavorite }: Props = $props();

  let text = $derived(removeFavorite ? $t('remove_from_favorites') : $t('to_favorite'));
  let icon = $derived(removeFavorite ? mdiHeartMinusOutline : mdiHeartOutline);

  let loading = $state(false);

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

      onFavorite?.(ids, isFavorite);

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
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      aria-label={$t('loading')}
      icon={mdiTimerSand}
      onclick={() => {}}
    />
  {:else}
    <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={handleFavorite} />
  {/if}
{/if}
