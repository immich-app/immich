<script lang="ts">
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import { getMenuContext } from '../asset-select-context-menu.svelte';
	import { OnAssetFavorite, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetFavorite: OnAssetFavorite = (asset, isFavorite) => {
		asset.isFavorite = isFavorite;
	};

	export let menuItem = false;
	export let isAll: boolean;

	const { getAssets, clearSelect } = getAssetControlContext();
	const closeMenu = getMenuContext();

	const handleFavorite = (isFavorite: boolean) => {
		closeMenu();

		let cnt = 0;
		for (const asset of getAssets()) {
			if (asset.isFavorite !== isFavorite) {
				api.assetApi.updateAsset(asset.id, { isFavorite });
				onAssetFavorite(asset, isFavorite);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `${isFavorite ? 'Added' : 'Removed'} ${cnt} to favorites`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

{#if menuItem}
	{#if isAll}
		<MenuOption text="Remove from Favorites" on:click={() => handleFavorite(false)} />
	{:else}
		<MenuOption text="Favorite" on:click={() => handleFavorite(true)} />
	{/if}
{:else}
	<!-- <CircleIconButton
		title="Remove Favorite"
		logo={HeartMinusOutline}
		on:click={() => handleFavorite(false)}
	/> -->
{/if}
