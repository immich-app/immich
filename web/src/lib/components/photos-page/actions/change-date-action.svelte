<script lang="ts">
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import { DateTime } from 'luxon';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeDate = false;

  const handleConfirm = async (dateTimeOriginal: string) => {
    isShowChangeDate = false;
    const ids = getSelectedAssets(getOwnedAssets(), $user);

    try {
      await api.assetApi.updateAssets({
        assetBulkUpdateDto: { ids, dateTimeOriginal },
      });
    } catch (error) {
      handleError(error, 'Unable to change date');
    }
    clearSelect();
  };
</script>

{#if menuItem}
  <MenuOption text="Change date" on:click={() => (isShowChangeDate = true)} />
{/if}
{#if isShowChangeDate}
  <ChangeDate
    initialDate={DateTime.now()}
    on:confirm={({ detail: date }) => handleConfirm(date)}
    on:cancel={() => (isShowChangeDate = false)}
  />
{/if}
