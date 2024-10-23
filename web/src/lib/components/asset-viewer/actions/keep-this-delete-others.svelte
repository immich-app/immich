<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { keepThisDeleteOthers } from '$lib/utils/asset-utils';
  import type { AssetResponseDto, StackResponseDto } from '@immich/sdk';
  import { mdiPinOutline } from '@mdi/js';
  import type { OnAction } from './action';

  export let stack: StackResponseDto;
  export let asset: AssetResponseDto;
  export let onAction: OnAction;

  const handleKeepThisDeleteOthers = async () => {
    const keptAsset = await keepThisDeleteOthers(asset.id, stack.id);
    if (keptAsset) {
      onAction({ type: AssetAction.UNSTACK, assets: [keptAsset] });
    }
  };
</script>

<MenuOption icon={mdiPinOutline} onClick={handleKeepThisDeleteOthers} text={'Keep this, delete others'} />
