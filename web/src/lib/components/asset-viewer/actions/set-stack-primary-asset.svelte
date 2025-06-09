<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';

  import { AssetAction } from '$lib/constants';
  import { updateStack, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
  import { mdiImageCheckOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    stack: StackResponseDto;
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { stack, asset, onAction }: Props = $props();

  const handleSetPrimaryAsset = async () => {
    const updatedStack = await updateStack({ id: stack.id, stackUpdateDto: { primaryAssetId: asset.id } });
    if (updatedStack) {
      onAction({ type: AssetAction.SET_STACK_PRIMARY_ASSET, stack: updatedStack });
    }
  };
</script>

<MenuOption icon={mdiImageCheckOutline} onClick={handleSetPrimaryAsset} text={$t('set_stack_primary_asset')} />
