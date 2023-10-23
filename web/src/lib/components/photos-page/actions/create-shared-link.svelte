<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { createEventDispatcher } from 'svelte';

  let showModal = false;
  const dispatch = createEventDispatcher();
  const { getAssets } = getAssetControlContext();
  const escape = () => {
    dispatch('escape');
    showModal = false;
  };
</script>

<CircleIconButton title="Share" logo={ShareVariantOutline} on:click={() => (showModal = true)} />

{#if showModal}
  <CreateSharedLinkModal
    assetIds={Array.from(getAssets()).map(({ id }) => id)}
    on:close={() => (showModal = false)}
    on:escape={escape}
  />
{/if}
