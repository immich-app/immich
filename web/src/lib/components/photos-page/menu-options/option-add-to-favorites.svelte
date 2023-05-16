<script lang="ts">
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let closeMenu: () => void;

	const { assets, clearSelect } = getAssetControlContext();

	const handleAddToFavorites = () => {
		closeMenu();

		let cnt = 0;
		for (const asset of assets) {
			if (!asset.isFavorite) {
				api.assetApi.updateAsset(asset.id, {
					isFavorite: true
				});
				asset.isFavorite = true;
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
