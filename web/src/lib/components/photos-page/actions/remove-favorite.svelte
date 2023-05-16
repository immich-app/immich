<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { api } from '@api';
	import HeartMinusOutline from 'svelte-material-icons/HeartMinusOutline.svelte';
	import { getAssetControlContext, OnAssetFavorite } from '../asset-select-control-bar.svelte';

	export let onAssetFavorite: OnAssetFavorite = (asset, favorite) => {
		asset.isFavorite = favorite;
	};

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleRemoveFavorite = async () => {
		for (const asset of getAssets()) {
			try {
				await api.assetApi.updateAsset(asset.id, {
					isFavorite: false
				});
				onAssetFavorite(asset, false);
			} catch {
				handleError(Error, 'Error updating asset favorite state');
			}
		}

		clearSelect();
	};
</script>

<slot {handleRemoveFavorite}>
	<CircleIconButton
		title="Remove Favorite"
		logo={HeartMinusOutline}
		on:click={handleRemoveFavorite}
	/>
</slot>
