<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { api } from '@api';
	import HeartMinusOutline from 'svelte-material-icons/HeartMinusOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	const { assets, clearSelect, removeAsset } = getAssetControlContext();

	const handleRemoveFavorite = async () => {
		for (const asset of assets) {
			try {
				await api.assetApi.updateAsset(asset.id, {
					isFavorite: false
				});
				removeAsset?.(asset.id);
				// favorites = favorites.filter((a) => a.id != asset.id);
			} catch {
				handleError(Error, 'Error updating asset favorite state');
			}
		}

		clearSelect();
	};
</script>

<CircleIconButton
	title="Remove Favorite"
	logo={HeartMinusOutline}
	on:click={handleRemoveFavorite}
/>
