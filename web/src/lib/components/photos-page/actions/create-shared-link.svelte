<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  let showModal = false;
  const { getAssets } = getAssetControlContext();
</script>

<CircleIconButton title="Share" icon={mdiShareVariantOutline} on:click={() => (showModal = true)} />

{#if showModal}
  <CreateSharedLinkModal assetIds={[...getAssets()].map(({ id }) => id)} onClose={() => (showModal = false)} />
{/if}
