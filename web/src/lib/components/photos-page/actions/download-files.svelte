<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	const { assets, clearSelect } = getAssetControlContext();

	const handleDownloadFiles = async () => {
		await bulkDownload('immich', Array.from(assets), clearSelect);
	};
</script>

<CircleIconButton title="Download" logo={CloudDownloadOutline} on:click={handleDownloadFiles} />
