<script lang="ts">
  import { api } from '@api';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import { handleError } from '../../../utils/handle-error';

  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeLocation = false;

  async function handleConfirm(point: { lng: number; lat: number }) {
    isShowChangeLocation = false;
    const ids = Array.from(getOwnedAssets())
      .filter((a) => !a.isExternal)
      .map((a) => a.id);

    try {
      await api.assetApi.updateAssets({
        assetBulkUpdateDto: {
          ids,
          latitude: point.lat,
          longitude: point.lng,
        },
      });
    } catch (error) {
      handleError(error, 'Unable to update location');
    }
    clearSelect();
  }
</script>

{#if menuItem}
  <MenuOption text="Change location" on:click={() => (isShowChangeLocation = true)} />
{/if}
{#if isShowChangeLocation}
  <ChangeLocation
    on:confirm={({ detail: point }) => handleConfirm(point)}
    on:cancel={() => (isShowChangeLocation = false)}
  />
{/if}
