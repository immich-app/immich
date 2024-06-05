<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import type { OnArchive } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline, mdiTimerSand } from '@mdi/js';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { t } from 'svelte-i18n';

  export let onArchive: OnArchive;

  export let menuItem = false;
  export let unarchive = false;

  $: text = unarchive ? $t('unarchive') : $t('archive');
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
        await updateAssets({ assetBulkUpdateDto: { ids, isArchived } });
      }

      for (const asset of assets) {
        asset.isArchived = isArchived;
      }

      onArchive(ids, isArchived);

      notificationController.show({
        message: `${isArchived ? $t('archived') : $t('unarchived')} ${ids.length}`,
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
  <MenuOption {text} {icon} on:click={handleArchive} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleArchive} />
  {/if}
{/if}
