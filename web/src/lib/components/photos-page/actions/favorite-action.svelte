<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import HeartMinusOutline from 'svelte-material-icons/HeartMinusOutline.svelte';
	import HeartOutline from 'svelte-material-icons/HeartOutline.svelte';
	import { OnAssetFavorite, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetFavorite: OnAssetFavorite = (asset, isFavorite) => {
		asset.isFavorite = isFavorite;
	};

	export let menuItem = false;
	export let removeFavorite: boolean;

	$: text = removeFavorite ? 'Remove from Favorites' : 'Favorite';
	$: logo = removeFavorite ? HeartMinusOutline : HeartOutline;

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleFavorite = () => {
		const isFavorite = !removeFavorite;

		let cnt = 0;
		for (const asset of getAssets()) {
			if (asset.isFavorite !== isFavorite) {
				api.assetApi.updateAsset({ id: asset.id, updateAssetDto: { isFavorite } });
				onAssetFavorite(asset, isFavorite);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: isFavorite ? `Added ${cnt} to favorites` : `Removed ${cnt} from favorites`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

{#if menuItem}
	<MenuOption {text} on:click={handleFavorite} />
{:else}
	<CircleIconButton title={text} {logo} on:click={handleFavorite} />
{/if}
