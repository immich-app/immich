<script lang="ts" context="module">
	export type ViewFrom =
		| 'archive-page'
		| 'album-page'
		| 'favorites-page'
		| 'search-page'
		| 'shared-link-page';
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { AssetResponseDto, SharedLinkResponseDto, ThumbnailFormat } from '@api';
	import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
	import justifiedLayout from 'justified-layout';
	import { flip } from 'svelte/animate';
	import { archivedAsset } from '$lib/stores/archived-asset.store';

	export let assets: AssetResponseDto[];
	export let sharedLink: SharedLinkResponseDto | undefined = undefined;
	export let selectedAssets: Set<AssetResponseDto> = new Set();
	export let disableAssetSelect = false;
	export let viewFrom: ViewFrom;
	export let showArchiveIcon = false;

	let isShowAssetViewer = false;

	let selectedAsset: AssetResponseDto;
	let currentViewAssetIndex = 0;

	let viewWidth: number;

	$: isMultiSelectionMode = selectedAssets.size > 0;

	function getAssetRatio(asset: AssetResponseDto): number {
		const height = asset.exifInfo?.exifImageHeight;
		const width = asset.exifInfo?.exifImageWidth;
		const orientation = Number(asset.exifInfo?.orientation);

		if (height && width) {
			if (orientation) {
				if (orientation == 6 || orientation == -90) {
					return height / width;
				} else {
					return width / height;
				}
			}

			return width / height;
		}

		return 1;
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

	const handleUnarchivedSuccess = (event: CustomEvent) => {
		const asset = event.detail as AssetResponseDto;
		switch (viewFrom) {
			case 'archive-page':
				$archivedAsset = $archivedAsset.filter((a) => a.id != asset.id);
				navigateAssetForward();
				break;
		}
	};
</script>

{#if assets.length > 0}
	<div class="flex flex-wrap gap-1 w-full pb-20" bind:clientWidth={viewWidth}>
		{#if viewWidth}
			{@const geoArray = assets.map(getAssetRatio)}
			{@const justifiedLayoutResult = justifiedLayout(geoArray, {
				targetRowHeight: 235,
				containerWidth: Math.floor(viewWidth)
			})}

			{#each assets as asset, index (asset.id)}
				<div animate:flip={{ duration: 500 }}>
					<Thumbnail
						{asset}
						thumbnailWidth={justifiedLayoutResult.boxes[index].width || 235}
						thumbnailHeight={justifiedLayoutResult.boxes[index].height || 235}
						readonly={disableAssetSelect}
						publicSharedKey={sharedLink?.key}
						format={assets.length < 7 ? ThumbnailFormat.Jpeg : ThumbnailFormat.Webp}
						on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
						on:select={selectAssetHandler}
						selected={selectedAssets.has(asset)}
						{showArchiveIcon}
					/>
				</div>
			{/each}
		{/if}
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
		on:unarchived={handleUnarchivedSuccess}
	/>
{/if}
