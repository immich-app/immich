<script lang="ts">
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeDate = false;

  const handleConfirm = async (dateTimeOriginal: string, keepTimeUnchanged: boolean) => {
    isShowChangeDate = false;
    const ids = getSelectedAssets(getOwnedAssets(), $user);

    try {
      await updateAssets({ assetBulkUpdateDto: { ids, dateTimeOriginal, keepTimeUnchanged } });
    } catch (error) {
      handleError(error, 'Unable to change date');
    }
    clearSelect();
  };
  const getInitialDate = () => {
    const ids = getSelectedAssets(getOwnedAssets(), $user);
    const selectedAsset = Array.from(getOwnedAssets()).find((asset) => ids.includes(asset.id));
    const initialDate = selectedAsset ? DateTime.fromISO(selectedAsset.fileCreatedAt) : DateTime.now();
    return initialDate;
  };
</script>

{#if menuItem}
  <MenuOption text="Change date" icon={mdiCalendarEditOutline} on:click={() => (isShowChangeDate = true)} />
{/if}
{#if isShowChangeDate}
  <ChangeDate
    initialDate={getInitialDate()}
    on:confirm={({ detail: date }) => handleConfirm(date.newDateValue, date.keepTimeUnchanged)}
    on:cancel={() => (isShowChangeDate = false)}
  />
{/if}
