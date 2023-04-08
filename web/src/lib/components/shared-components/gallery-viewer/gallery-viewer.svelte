<script lang="ts" context="module">
	/**
	 * Computed positional and sizing properties of a box in the layout.
	 */
	interface LayoutBox {
		/**
		 * Aspect ratio of the box.
		 */
		aspectRatio: number;
		/**
		 * Distance between the top side of the box and the top boundary of the justified layout.
		 */
		top: number;
		/**
		 * Width of the box in a justified layout.
		 */
		width: number;
		/**
		 * Height of the box in a justified layout.
		 */
		height: number;
		/**
		 * Distance between the left side of the box and the left boundary of the justified layout.
		 */
		left: number;
		/**
		 * Whether or not the aspect ratio was forced.
		 */
		forcedAspectRatio?: boolean;
	}

	/**
	 * Results from calculating the justified layout.
	 */
	export interface JustifiedLayoutResult {
		/**
		 * Height of the container containing the justified layout.
		 */
		containerHeight: number;
		/**
		 * Number of items that are in rows that aren't fully-packed.
		 */
		widowCount: number;
		/**
		 * Computed positional and sizing properties of a box in the justified layout.
		 */
		boxes: LayoutBox[];
	}
</script>

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
	let justifiedLayoutResult: JustifiedLayoutResult;
	const geoArray: Array<number> = [];

	onMount(() => {
		assets.forEach((asset) => {
			geoArray.push(getAssetRatio(asset));
		});

		buildJustifiedLayout();
	});

	$: {
		if (viewWidth) {
			buildJustifiedLayout();
		}
	}

	// Recalculate the layout when the assets (add/remove) change
	$: {
		assets.forEach((asset) => {
			geoArray.push(getAssetRatio(asset));
		});
	}
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

	const buildJustifiedLayout = () => {
		justifiedLayoutResult = justifiedLayout(geoArray, {
			targetRowHeight: 235,
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
			{#if justifiedLayoutResult?.boxes != null && justifiedLayoutResult?.boxes.length > 0 && justifiedLayoutResult.boxes[index] != null}
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
