<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import GeolocationPointPickerModal from '$lib/modals/GeolocationPointPickerModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { getAssetControlContext } from '$lib/utils/context';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiMapMarkerMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    menuItem?: boolean;
  };

  let { menuItem = false }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const onAction = async () => {
    const point = await modalManager.show(GeolocationPointPickerModal, {});
    if (!point) {
      return;
    }

    const ids = getOwnedAssetsWithWarning(getOwnedAssets(), $user);

    try {
      await updateAssets({ assetBulkUpdateDto: { ids, latitude: point.lat, longitude: point.lng } });
      toastManager.primary();
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_location'));
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_location')} icon={mdiMapMarkerMultipleOutline} onClick={onAction} />
{/if}
