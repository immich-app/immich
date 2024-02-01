<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiArchiveArrowUpOutline, mdiArchiveArrowDownOutline, mdiTimerSand } from '@mdi/js';
  import type { OnArchive } from '$lib/utils/actions';

  export let onArchive: OnArchive | undefined = undefined;

  export let menuItem = false;
  export let unarchive = false;

  $: text = unarchive ? 'Unarchive' : 'Archive';
  $: icon = unarchive ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline;

  let loading = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleArchive = async () => {
    const isArchived = !unarchive;
    loading = true;

    try {
      const assets = [...getOwnedAssets()].filter((asset) => asset.isArchived !== isArchived);
      const ids = assets.map(({ id }) => id);

      if (ids.length > 0) {
        await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, isArchived } });
      }

      for (const asset of assets) {
        asset.isArchived = isArchived;
      }

      onArchive?.(ids, isArchived);

      notificationController.show({
        message: `${isArchived ? 'Archived' : 'Unarchived'} ${ids.length}`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, `Unable to ${isArchived ? 'archive' : 'unarchive'}`);
    } finally {
      loading = false;
    }
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
