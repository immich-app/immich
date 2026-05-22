<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import AssetUpdateDescriptionConfirmModal from '$lib/modals/AssetUpdateDescriptionConfirmModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();

  const handleUpdateDescription = async () => {
    const description = await modalManager.show(AssetUpdateDescriptionConfirmModal);
    if (description) {
      const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, $user);

      try {
        await updateAssets({ assetBulkUpdateDto: { ids, description } });
        assetMultiSelectManager.clear();
      } catch (error) {
        handleError(error, $t('errors.unable_to_change_description'));
      }
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_description')} icon={mdiText} onClick={() => handleUpdateDescription()} />
{/if}
