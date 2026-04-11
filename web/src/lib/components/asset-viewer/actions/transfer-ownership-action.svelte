<script lang="ts">
  import type { OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import TransferOwnershipModal from '$lib/modals/TransferOwnershipModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { transferAssets, type AssetResponseDto } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiAccountArrowRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    preAction: PreAction;
  }

  let { asset, onAction, preAction }: Props = $props();

  const handleTransfer = async () => {
    const selectedUser = await modalManager.show(TransferOwnershipModal, {
      currentUserId: $user?.id ?? '',
    });

    if (!selectedUser) {
      return;
    }

    const timelineAsset = toTimelineAsset(asset);

    try {
      await transferAssets({ assetTransferDto: { ids: [asset.id], newOwnerId: selectedUser.id } });
      // Navigate away only AFTER a successful transfer
      preAction({ type: AssetAction.TRANSFER, asset: timelineAsset });
      toastManager.primary($t('transfer_success'));
      onAction({ type: AssetAction.TRANSFER, asset: timelineAsset });
    } catch (error) {
      handleError(error, $t('errors.unable_to_transfer_assets'));
    }
  };
</script>

<MenuOption icon={mdiAccountArrowRight} text={$t('transfer_ownership')} onClick={handleTransfer} />

