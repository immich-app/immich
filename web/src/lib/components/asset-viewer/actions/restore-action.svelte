<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { restoreAssets, type AssetResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { mdiCheck, mdiHistory } from '@mdi/js';
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
      onAction({ type: AssetAction.RESTORE, asset: toTimelineAsset(asset) });
      toastManager.show({ title: $t('success'), description: $t('restored_asset'), icon: mdiCheck });
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_assets'));
    }
  };
</script>

<MenuOption icon={mdiHistory} onClick={handleRestoreAsset} text={$t('restore')} />
