<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { OnFavorite } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
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

  const handleFavorite = async () => {
    const isFavorite = !removeFavorite;
    loading = true;

    try {
      const assets = assetMultiSelectManager.ownedAssets.filter((asset) => asset.isFavorite !== isFavorite);

      const ids = assets.map(({ id }) => id);

      if (ids.length > 0) {
        await updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });
      }

      for (const asset of assets) {
        asset.isFavorite = isFavorite;
      }

      onFavorite?.(ids, isFavorite);

      toastManager.primary(
        isFavorite
          ? $t('added_to_favorites_count', { values: { count: ids.length } })
          : $t('removed_from_favorites_count', { values: { count: ids.length } }),
      );

      assetMultiSelectManager.clear();
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
