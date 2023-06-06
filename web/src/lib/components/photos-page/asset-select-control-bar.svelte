<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';

	export type OnAssetDelete = (assetId: string) => void;
	export type OnAssetArchive = (asset: AssetResponseDto, archived: boolean) => void;
	export type OnAssetFavorite = (asset: AssetResponseDto, favorite: boolean) => void;

	export interface AssetControlContext {
		// Wrap assets in a function, because context isn't reactive.
		getAssets: () => Set<AssetResponseDto>;
		clearSelect: () => void;
	}

	const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
	export { getAssetControlContext };
</script>

<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import type { AssetResponseDto } from '@api';
	import Close from 'svelte-material-icons/Close.svelte';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';

	export let assets: Set<AssetResponseDto>;
	export let clearSelect: () => void;

	setContext({ getAssets: () => assets, clearSelect });
</script>

<ControlAppBar
	on:close-button-click={clearSelect}
	backIcon={Close}
	tailwindClasses="bg-white shadow-md"
>
	<p class="font-medium text-immich-primary dark:text-immich-dark-primary" slot="leading">
		Selected {assets.size.toLocaleString($locale)}
	</p>
	<slot slot="trailing" />
</ControlAppBar>
