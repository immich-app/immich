<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { type AssetStore, isSelectingAllAssets } from '$lib/stores/assets.store';
  import { mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { selectAllAssets, cancelMultiselect } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    assetStore: AssetStore;
    assetInteraction: AssetInteraction;
  }

  let { assetStore, assetInteraction }: Props = $props();

  const handleSelectAll = async () => {
    await selectAllAssets(assetStore, assetInteraction);
  };

  const handleCancel = () => {
    cancelMultiselect(assetInteraction);
  };
</script>

{#if $isSelectingAllAssets}
  <CircleIconButton title={$t('unselect_all')} icon={mdiSelectRemove} onclick={handleCancel} />
{:else}
  <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />
{/if}
