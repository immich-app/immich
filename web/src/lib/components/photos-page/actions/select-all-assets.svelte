<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteraction, BaseInteractionAsset } from '$lib/stores/asset-interaction.svelte';
  import { type AssetStore, isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { cancelMultiselect, selectAllAssets } from '$lib/utils/asset-utils';
  import { mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    assetStore: AssetStore;
    assetInteraction: AssetInteraction<BaseInteractionAsset>;
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
