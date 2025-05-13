<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { AssetAction } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { keepThisDeleteOthers } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto, StackResponseDto } from '@immich/sdk';
  import { mdiPinOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    stack: StackResponseDto;
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { stack, asset, onAction }: Props = $props();

  const handleKeepThisDeleteOthers = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: $t('keep_this_delete_others'),
      prompt: $t('confirm_keep_this_delete_others'),
      confirmText: $t('delete_others'),
    });

    if (!isConfirmed) {
      return;
    }

    const keptAsset = await keepThisDeleteOthers(asset, stack);
    if (keptAsset) {
      onAction({ type: AssetAction.UNSTACK, assets: [toTimelineAsset(keptAsset)] });
    }
  };
</script>

<MenuOption icon={mdiPinOutline} onClick={handleKeepThisDeleteOthers} text={$t('keep_this_delete_others')} />
