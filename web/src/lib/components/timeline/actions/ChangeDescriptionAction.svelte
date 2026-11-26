<script lang="ts">
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import AssetUpdateDescriptionConfirmModal from '#lib/modals/AssetUpdateDescriptionConfirmModal.svelte';
  import { updateAssetsMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { getOwnedAssetsWithWarning } from '#lib/utils/asset-utils.ts';
  import { modalManager } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/MenuOption.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();

  const handleUpdateDescription = async () => {
    const description = await modalManager.show(AssetUpdateDescriptionConfirmModal);
    if (description) {
      const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, authManager.user);
      await executeMutation(
        () => updateAssetsMutation({ error: { toast: 'errors.unable_to_change_description' } }),
        [{ assetBulkUpdateDto: { ids, description } }],
        { onSuccess: () => assetMultiSelectManager.clear() },
      );
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_description')} icon={mdiText} onClick={() => handleUpdateDescription()} />
{/if}
