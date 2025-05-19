<script lang="ts">
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import AssetUpdateDecriptionConfirmModal from '$lib/modals/AssetUpdateDecriptionConfirmModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleUpdateDescription = async () => {
    const description = await modalManager.show(AssetUpdateDecriptionConfirmModal, {});
    if (description) {
      const ids = getSelectedAssets(getOwnedAssets(), $user);

      try {
        await updateAssets({ assetBulkUpdateDto: { ids, description } });
      } catch (error) {
        handleError(error, $t('errors.unable_to_change_description'));
      }
      clearSelect();
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_description')} icon={mdiText} onClick={() => handleUpdateDescription()} />
{/if}
