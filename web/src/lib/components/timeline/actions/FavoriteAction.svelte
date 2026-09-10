<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { OnFavorite } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
  import { mdiHeartMinusOutline, mdiHeartOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { toggleFavoriteAssets } from '$lib/utils/asset-utils'

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
      await toggleFavoriteAssets(assets, isFavorite, onFavorite);
      assetMultiSelectManager.clear();
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
