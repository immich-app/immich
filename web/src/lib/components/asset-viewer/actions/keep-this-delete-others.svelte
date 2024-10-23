<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { keepThisDeleteOthers } from '$lib/utils/asset-utils';
  import type { AssetResponseDto, StackResponseDto } from '@immich/sdk';
  import { mdiPinOutline } from '@mdi/js';
  import type { OnAction } from './action';
  import { t } from 'svelte-i18n';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let stack: StackResponseDto;
  export let asset: AssetResponseDto;
  export let onAction: OnAction;

  const handleKeepThisDeleteOthers = async () => {
    const isConfirmed = await dialogController.show({
      title: $t('keep_this_delete_others'),
      prompt: $t('confirm_keep_this_delete_others'),
      confirmText: $t('delete_others'),
    });

    if (!isConfirmed) {
      return;
    }

    const keptAsset = await keepThisDeleteOthers(asset, stack);
    if (keptAsset) {
      onAction({ type: AssetAction.UNSTACK, assets: [keptAsset] });
    }
  };
</script>

<MenuOption icon={mdiPinOutline} onClick={handleKeepThisDeleteOthers} text={$t('keep_this_delete_others')} />
