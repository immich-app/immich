<script lang="ts">
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiMapMarkerMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeLocation = false;

  async function handleConfirm(point: { lng: number; lat: number }) {
    isShowChangeLocation = false;
    const ids = getSelectedAssets(getOwnedAssets(), $user);

    try {
      await updateAssets({ assetBulkUpdateDto: { ids, latitude: point.lat, longitude: point.lng } });
    } catch (error) {
      handleError(error, $t('unable_to_update_location'));
    }
    clearSelect();
  }
</script>

{#if menuItem}
  <MenuOption
    text={$t('change_location')}
    icon={mdiMapMarkerMultipleOutline}
    on:click={() => (isShowChangeLocation = true)}
  />
{/if}
{#if isShowChangeLocation}
  <ChangeLocation
    on:confirm={({ detail: point }) => handleConfirm(point)}
    on:cancel={() => (isShowChangeLocation = false)}
  />
{/if}
