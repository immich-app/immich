<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { unstackAssets } from '$lib/utils/asset-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiImageMinusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  export let stackedAssets: AssetResponseDto[];
  export let onAction: OnAction;

  const handleUnstack = async () => {
    const unstackedAssets = await unstackAssets(stackedAssets);
    if (unstackedAssets) {
      onAction({ type: AssetAction.UNSTACK, assets: unstackedAssets });
    }
  };
</script>

<MenuOption icon={mdiImageMinusOutline} onClick={handleUnstack} text={$t('unstack')} />
