<script lang="ts">
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import RemoveFavorite from '../actions/remove-favorite.svelte';
	import { getMenuContext } from '../asset-select-context-menu.svelte';
	import { OnAssetFavorite } from '../asset-select-control-bar.svelte';

	export let onAssetFavorite: OnAssetFavorite | undefined = undefined;
	const closeMenu = getMenuContext();
</script>

<RemoveFavorite let:handleRemoveFavorite {onAssetFavorite}>
	<MenuOption
		on:click={() => {
			closeMenu();
			handleRemoveFavorite();
		}}
		text="Remove from favorites"
	/>
</RemoveFavorite>
