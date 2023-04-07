<script lang="ts">
	import { page } from '$app/stores';
	import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { AssetResponseDto, SharedLinkResponseDto, ThumbnailFormat } from '@api';

	import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
	import { onMount } from 'svelte';
	import justifiedLayout from 'justified-layout';

	export let assets: AssetResponseDto[];
	export let sharedLink: SharedLinkResponseDto | undefined = undefined;
	export let selectedAssets: Set<AssetResponseDto> = new Set();
	export let disableAssetSelect = false;

	let isShowAssetViewer = false;

	let selectedAsset: AssetResponseDto;
	let currentViewAssetIndex = 0;

	let viewWidth: number;
	let thumbnailSize = 300;
	let justifiedLayoutResult: any;
	const geoArray: Array<number> = [];

	onMount(() => {
		getAssetRatio();
		buildJustifiedLayout();
	});

	$: {
		if (viewWidth) {
			buildJustifiedLayout();
		}
	}
	$: isMultiSelectionMode = selectedAssets.size > 0;

	const getAssetRatio = () => {
		assets.forEach((a) => {
			if (a.exifInfo?.exifImageHeight && a.exifInfo?.exifImageWidth) {
				const height = a.exifInfo?.exifImageHeight;
				const width = a.exifInfo?.exifImageWidth;
				const orientation = Number(a.exifInfo?.orientation);

				if (orientation !== null && orientation !== undefined) {
					if (orientation == 6 || orientation == -90) {
						geoArray.push(height / width);
						return;
					} else {
						geoArray.push(width / height);
						return;
					}
				}

				geoArray.push(width / height);
			} else {
				geoArray.push(1);
			}
		});
	};

	const buildJustifiedLayout = () => {
		justifiedLayoutResult = justifiedLayout(geoArray, {
			targetRowHeight: 250,
			containerWidth: viewWidth
		});
	};

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
		{#each assets as asset, index (asset.id)}
			{#if justifiedLayoutResult?.boxes != null && justifiedLayoutResult?.boxes.length > 0}
				<Thumbnail
					{asset}
					thumbnailWidth={justifiedLayoutResult.boxes[index].width || 250}
					thumbnailHeight={justifiedLayoutResult.boxes[index].height || 250}
					readonly={disableAssetSelect}
					publicSharedKey={sharedLink?.key}
					format={assets.length < 7 ? ThumbnailFormat.Jpeg : ThumbnailFormat.Webp}
					on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
					on:select={selectAssetHandler}
					selected={selectedAssets.has(asset)}
				/>
			{/if}
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
