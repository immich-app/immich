<script lang="ts">
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import { getMenuContext } from '../asset-select-context-menu.svelte';
	import { OnAssetFavorite, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetFavorite: OnAssetFavorite = (asset, favorite) => {
		asset.isFavorite = favorite;
	};

	const { getAssets, clearSelect } = getAssetControlContext();
	const closeMenu = getMenuContext();

	const handleAddToFavorites = () => {
		closeMenu();

		let cnt = 0;
		for (const asset of getAssets()) {
			if (!asset.isFavorite) {
				api.assetApi.updateAsset(asset.id, {
					isFavorite: true
				});
				onAssetFavorite(asset, true);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `Added ${cnt} to favorites`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

<MenuOption on:click={handleAddToFavorites} text="Add to Favorites" />
