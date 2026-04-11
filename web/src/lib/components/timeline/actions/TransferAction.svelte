<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import TransferOwnershipModal from '$lib/modals/TransferOwnershipModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { transferAssets } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiAccountArrowRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    menuItem?: boolean;
    onTransfer?: (assetIds: string[]) => void;
  };

  let { menuItem = false, onTransfer }: Props = $props();

  const handleTransfer = async () => {
    const selectedUser = await modalManager.show(TransferOwnershipModal, {
      currentUserId: $user.id,
    });

    if (!selectedUser) {
      return;
    }

    const assets = assetMultiSelectManager.getOwnedAssets();
    const ids = assets.map((a) => a.id);

    try {
      await transferAssets({ assetTransferDto: { ids, newOwnerId: selectedUser.id } });
      toastManager.primary($t('transfer_success'));
      onTransfer?.(ids);
      assetMultiSelectManager.clear();
    } catch (error) {
      handleError(error, $t('errors.unable_to_transfer_assets'));
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('transfer_ownership')} icon={mdiAccountArrowRight} onClick={handleTransfer} />
{/if}

