<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  let showModal = false;
  const { getAssets } = getAssetControlContext();
</script>

<CircleIconButton title="Share" logo={ShareVariantOutline} on:click={() => (showModal = true)} />

{#if showModal}
  <CreateSharedLinkModal assetIds={Array.from(getAssets()).map(({ id }) => id)} on:close={() => (showModal = false)} />
{/if}
