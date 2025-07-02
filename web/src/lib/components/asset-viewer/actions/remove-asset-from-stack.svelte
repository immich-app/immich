<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';

  import { AssetAction } from '$lib/constants';
  import { stackAssets } from '$lib/utils/asset-utils';
  import type { AssetResponseDto, StackResponseDto } from '@immich/sdk';
  import { mdiImageCheckOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    stack: StackResponseDto;
    onAction: OnAction;
  }

  let { asset, stack, onAction }: Props = $props();

  const handleRemoveFromStack = async () => {
    const assets = stack.assets.filter((a) => a.id !== asset.id);
    const result = await stackAssets(assets, false, false);
    if (result) {
      onAction({ type: AssetAction.REMOVE_ASSET_FROM_STACK, stack: result.stack ? result.stack : null, asset });
    }
  };
</script>

<MenuOption icon={mdiImageCheckOutline} onClick={handleRemoveFromStack} text={$t('viewer_remove_from_stack')} />
