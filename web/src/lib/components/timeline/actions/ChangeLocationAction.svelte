<script lang="ts">
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { mdiMapMarkerMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeLocation = $state(false);

  async function handleConfirm(point?: { lng: number; lat: number }) {
    isShowChangeLocation = false;

    if (!point) {
      return;
    }

    const ids = getSelectedAssets(getOwnedAssets(), $user);

    try {
      await updateAssets({ assetBulkUpdateDto: { ids, latitude: point.lat, longitude: point.lng } });
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_location'));
    }
  }
</script>

{#if menuItem}
  <MenuOption
    text={$t('change_location')}
    icon={mdiMapMarkerMultipleOutline}
    onClick={() => (isShowChangeLocation = true)}
  />
{/if}
{#if isShowChangeLocation}
  <ChangeLocation onClose={handleConfirm} />
{/if}
