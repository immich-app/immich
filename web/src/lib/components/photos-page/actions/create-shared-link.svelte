<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
	import { SharedLinkType } from '@api';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	let showModal = false;
	const { getAssets, clearSelect } = getAssetControlContext();
</script>

<CircleIconButton title="Share" logo={ShareVariantOutline} on:click={() => (showModal = true)} />

{#if showModal}
	<CreateSharedLinkModal
		sharedAssets={Array.from(getAssets())}
		shareType={SharedLinkType.Individual}
		on:close={() => {
			showModal = false;
			clearSelect();
		}}
	/>
{/if}
