<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { deleteStack } from '$lib/utils/asset-utils';
  import type { StackResponseDto } from '@immich/sdk';
  import { mdiImageMinusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    stack: StackResponseDto;
    onAction: OnAction;
  }

  let { stack, onAction }: Props = $props();

  const handleUnstack = async () => {
    const unstackedAssets = await deleteStack([stack.id]);
    if (unstackedAssets) {
      onAction({ type: AssetAction.UNSTACK, assets: unstackedAssets });
    }
  };
</script>

<MenuOption icon={mdiImageMinusOutline} onClick={handleUnstack} text={$t('unstack')} />
