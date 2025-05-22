<script lang="ts">
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { type AssetStore, isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { cancelMultiselect, selectAllAssets } from '$lib/utils/asset-utils';
  import { Button, IconButton } from '@immich/ui';
  import { mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    assetStore: AssetStore;
    assetInteraction: AssetInteraction;
    withText?: boolean;
  }

  let { assetStore, assetInteraction, withText = false }: Props = $props();

  const handleSelectAll = async () => {
    await selectAllAssets(assetStore, assetInteraction);
  };

  const handleCancel = () => {
    cancelMultiselect(assetInteraction);
  };
</script>

{#if withText}
  <Button
    leadingIcon={$isSelectingAllAssets ? mdiSelectRemove : mdiSelectAll}
    size="medium"
    color="secondary"
    variant="ghost"
    onclick={$isSelectingAllAssets ? handleCancel : handleSelectAll}
  >
    {$isSelectingAllAssets ? $t('unselect_all') : $t('select_all')}
  </Button>
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$isSelectingAllAssets ? $t('unselect_all') : $t('select_all')}
    icon={$isSelectingAllAssets ? mdiSelectRemove : mdiSelectAll}
    onclick={$isSelectingAllAssets ? handleCancel : handleSelectAll}
  />
{/if}
