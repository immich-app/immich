<script lang="ts">
  import MenuOption from '#lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import GeolocationPointPickerModal from '#lib/modals/GeolocationPointPickerModal.svelte';
  import { updateAssetsMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { getOwnedAssetsWithWarning } from '#lib/utils/asset-utils.ts';
  import { modalManager } from '@immich/ui';
  import { mdiMapMarkerMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    menuItem?: boolean;
  };

  let { menuItem = false }: Props = $props();

  const onAction = async () => {
    const point = await modalManager.show(GeolocationPointPickerModal, {});
    if (!point) {
      return;
    }

    const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, authManager.user);
    await executeMutation(
      () => updateAssetsMutation({ success: { toast: true }, error: { toast: 'errors.unable_to_update_location' } }),
      [{ assetBulkUpdateDto: { ids, latitude: point.lat, longitude: point.lng } }],
      { onSuccess: () => assetMultiSelectManager.clear() },
    );
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_location')} icon={mdiMapMarkerMultipleOutline} onClick={onAction} />
{/if}
