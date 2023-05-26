<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import { AssetResponseDto, SharedLinkResponseDto, api } from '@api';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let sharedLink: SharedLinkResponseDto;
	export let allAssets: AssetResponseDto[];

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleRemoveAssetsFromSharedLink = async () => {
		if (window.confirm('Do you want to remove selected assets from the shared link?')) {
			// TODO: Rename API method or change functionality. The assetIds passed
			// in are kept instead of removed.
			const assetsToKeep = allAssets.filter((a) => !getAssets().has(a));
			await api.assetApi.removeAssetsFromSharedLink({
				removeAssetsDto: {
					assetIds: assetsToKeep.map((a) => a.id)
				},
				key: sharedLink?.key
			});

			sharedLink.assets = assetsToKeep;
			clearSelect();
		}
	};
</script>

<CircleIconButton
	title="Remove from album"
	on:click={handleRemoveAssetsFromSharedLink}
	logo={DeleteOutline}
/>
