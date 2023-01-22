<script lang="ts">
	import { page } from '$app/stores';
	import { handleError } from '$lib/utils/handle-error';
	import { AssetResponseDto, SharedLinkResponseDto, ThumbnailFormat } from '@api';

	import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
	import ImmichThumbnail from '../../shared-components/immich-thumbnail.svelte';

	export let assets: AssetResponseDto[];
	export let sharedLink: SharedLinkResponseDto | undefined = undefined;
	export let selectedAssets: Set<AssetResponseDto> = new Set();

	let isShowAssetViewer = false;

	let selectedAsset: AssetResponseDto;
	let currentViewAssetIndex = 0;

	let viewWidth: number;
	let thumbnailSize = 300;

	$: isMultiSelectionMode = selectedAssets.size > 0;

	$: {
		if (assets.length < 6) {
			thumbnailSize = Math.floor(viewWidth / assets.length - assets.length);
		} else {
			if (viewWidth > 600) thumbnailSize = Math.floor(viewWidth / 6 - 6);
			else if (viewWidth > 400) thumbnailSize = Math.floor(viewWidth / 4 - 6);
			else if (viewWidth > 300) thumbnailSize = Math.floor(viewWidth / 2 - 6);
			else if (viewWidth > 200) thumbnailSize = Math.floor(viewWidth / 2 - 6);
			else if (viewWidth > 100) thumbnailSize = Math.floor(viewWidth / 1 - 6);
		}
	}

	const viewAssetHandler = (event: CustomEvent) => {
		const { asset }: { asset: AssetResponseDto } = event.detail;

		currentViewAssetIndex = assets.findIndex((a) => a.id == asset.id);
		selectedAsset = assets[currentViewAssetIndex];
		isShowAssetViewer = true;
		pushState(selectedAsset.id);
	};

	const selectAssetHandler = (event: CustomEvent) => {
		const { asset }: { asset: AssetResponseDto } = event.detail;
		let temp = new Set(selectedAssets);

		if (selectedAssets.has(asset)) {
			temp.delete(asset);
		} else {
			temp.add(asset);
		}

		selectedAssets = temp;
	};

	const navigateAssetForward = () => {
		try {
			if (currentViewAssetIndex < assets.length - 1) {
				currentViewAssetIndex++;
				selectedAsset = assets[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			handleError(e, 'Cannot navigate to the next asset');
		}
	};

	const navigateAssetBackward = () => {
		try {
			if (currentViewAssetIndex > 0) {
				currentViewAssetIndex--;
				selectedAsset = assets[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			handleError(e, 'Cannot navigate to previous asset');
		}
	};

	const pushState = (assetId: string) => {
		// add a URL to the browser's history
		// changes the current URL in the address bar but doesn't perform any SvelteKit navigation
		history.pushState(null, '', `${$page.url.pathname}/photos/${assetId}`);
	};

	const closeViewer = () => {
		isShowAssetViewer = false;
		history.pushState(null, '', `${$page.url.pathname}`);
	};
</script>

{#if assets.length > 0}
	<div class="flex flex-wrap gap-1 w-full pb-20" bind:clientWidth={viewWidth}>
		{#each assets as asset (asset.id)}
			<ImmichThumbnail
				{asset}
				{thumbnailSize}
				publicSharedKey={sharedLink?.key}
				format={assets.length < 7 ? ThumbnailFormat.Jpeg : ThumbnailFormat.Webp}
				on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
				on:select={selectAssetHandler}
				selected={selectedAssets.has(asset)}
			/>
		{/each}
	</div>
{/if}

<!-- Overlay Asset Viewer -->
{#if isShowAssetViewer}
	<AssetViewer
		asset={selectedAsset}
		publicSharedKey={sharedLink?.key}
		{sharedLink}
		on:navigate-previous={navigateAssetBackward}
		on:navigate-next={navigateAssetForward}
		on:close={closeViewer}
	/>
{/if}
