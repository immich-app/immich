<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreAssets, type AssetResponseDto } from '@immich/sdk';
  import { mdiHistory } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { asset = $bindable(), onAction }: Props = $props();

  const handleRestoreAsset = async () => {
    try {
      await restoreAssets({ bulkIdsDto: { ids: [asset.id] } });
      asset.isTrashed = false;

      onAction({ type: AssetAction.RESTORE, asset });

      notificationController.show({
        type: NotificationType.Info,
        message: $t('restored_asset'),
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_assets'));
    }
  };
</script>

<MenuOption icon={mdiHistory} onClick={handleRestoreAsset} text={$t('restore')} />
