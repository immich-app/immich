<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';

  import { AssetAction } from '$lib/constants';
  import { removeAssetFromStack, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
  import { mdiImageMinusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    stack: StackResponseDto;
    onAction: OnAction;
  }

  let { asset, stack, onAction }: Props = $props();

  const handleRemoveFromStack = async () => {
    await removeAssetFromStack({
      id: stack.id,
      assetId: asset.id,
    });
    const updatedStack = {
      ...stack,
      assets: stack.assets.filter((a) => a.id !== asset.id),
    };
    onAction({ type: AssetAction.REMOVE_ASSET_FROM_STACK, stack: updatedStack, asset });
  };
</script>

<MenuOption icon={mdiImageMinusOutline} onClick={handleRemoveFromStack} text={$t('viewer_remove_from_stack')} />
