<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { type AssetStore, isSelectingAllAssets } from '$lib/stores/assets.store';
  import { mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { selectAllAssets, cancelMultiselect } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';

  interface Props {
    assetStore: AssetStore;
    assetInteractionStore: AssetInteractionStore;
  }

  let { assetStore, assetInteractionStore }: Props = $props();

  const handleSelectAll = async () => {
    await selectAllAssets(assetStore, assetInteractionStore);
  };

  const handleCancel = () => {
    cancelMultiselect(assetInteractionStore);
  };
</script>

{#if $isSelectingAllAssets}
  <CircleIconButton title={$t('unselect_all')} icon={mdiSelectRemove} onclick={handleCancel} />
{:else}
  <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />
{/if}
