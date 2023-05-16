<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';

	export interface AssetControlContext {
		assets: Set<AssetResponseDto>;
		clearSelect: () => void;
		removeAsset?: (assetId: string) => void;
	}

	const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
	export { getAssetControlContext };
</script>

<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import { AssetResponseDto } from '@api';
	import Close from 'svelte-material-icons/Close.svelte';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';

	export let options: AssetControlContext;

	setContext(options);
</script>

<ControlAppBar
	on:close-button-click={options.clearSelect}
	backIcon={Close}
	tailwindClasses="bg-white shadow-md"
>
	<p class="font-medium text-immich-primary dark:text-immich-dark-primary" slot="leading">
		Selected {options.assets.size.toLocaleString($locale)}
	</p>
	<slot slot="trailing" />
</ControlAppBar>
