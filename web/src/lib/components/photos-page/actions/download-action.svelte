<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let filename = 'immich';
	export let sharedLinkKey: string | undefined = undefined;
	export let menuItem = false;

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleDownloadFiles = async () => {
		await bulkDownload(filename, Array.from(getAssets()), clearSelect, sharedLinkKey);
	};
</script>

{#if menuItem}
	<MenuOption text="Download" on:click={handleDownloadFiles} />
{:else}
	<CircleIconButton title="Download" logo={CloudDownloadOutline} on:click={handleDownloadFiles} />
{/if}
