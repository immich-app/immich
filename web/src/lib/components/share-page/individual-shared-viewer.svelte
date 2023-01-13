<script lang="ts">
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import { AssetResponseDto, SharedLinkResponseDto, ThumbnailFormat } from '@api';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import { goto } from '$app/navigation';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import { page } from '$app/stores';
	import AssetViewer from '../asset-viewer/asset-viewer.svelte';
	import { bulkDownload } from '$lib/utils/asset-utils';

	export let sharedLink: SharedLinkResponseDto;

	let assets = sharedLink.assets;
	let thumbnailSize = 300;
	let viewWidth: number;
	let currentViewAssetIndex = 0;
	let selectedAsset: AssetResponseDto;
	let multiSelectAsset: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = multiSelectAsset.size > 0;
	let isShowAssetViewer = false;

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

	const clearMultiSelectAssetAssetHandler = () => {
		multiSelectAsset = new Set();
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
		let temp = new Set(multiSelectAsset);

		if (multiSelectAsset.has(asset)) {
			temp.delete(asset);
		} else {
			temp.add(asset);
		}

		multiSelectAsset = temp;
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

	const navigateAssetForward = () => {
		try {
			if (currentViewAssetIndex < assets.length - 1) {
				currentViewAssetIndex++;
				selectedAsset = assets[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			console.error(e);
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
			console.error(e);
		}
	};

	const downloadAllAssets = async () => {
		await bulkDownload(
			'immich-shared',
			assets,
			() => {
				isMultiSelectionMode = false;
				clearMultiSelectAssetAssetHandler();
			},
			sharedLink?.key
		);
	};
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
	<ControlAppBar
		on:close-button-click={() => goto('/photos')}
		backIcon={ArrowLeft}
		showBackButton={false}
	>
		<svelte:fragment slot="leading">
			<a
				data-sveltekit-preload-data="hover"
				class="flex gap-2 place-items-center hover:cursor-pointer ml-6"
				href="https://immich.app"
			>
				<img src="/immich-logo.svg" alt="immich logo" height="30" width="30" />
				<h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">
					IMMICH
				</h1>
			</a>
		</svelte:fragment>

		<svelte:fragment slot="trailing">
			{#if sharedLink?.allowUpload}
				<CircleIconButton
					title="Add Photos"
					on:click={() => openFileUploadDialog(undefined, sharedLink?.key)}
					logo={FileImagePlusOutline}
				/>
			{/if}

			<CircleIconButton
				title="Download"
				on:click={downloadAllAssets}
				logo={FolderDownloadOutline}
			/>
		</svelte:fragment>
	</ControlAppBar>
	<section class="flex flex-col my-[160px] px-6 sm:px-12 md:px-24 lg:px-40">
		{#if assets.length > 0}
			<div class="flex flex-wrap gap-1 w-full pb-20" bind:clientWidth={viewWidth}>
				{#each assets as asset (asset.id)}
					{#if assets.length < 7}
						<ImmichThumbnail
							{asset}
							{thumbnailSize}
							publicSharedKey={sharedLink?.key}
							format={ThumbnailFormat.Jpeg}
							on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
							on:select={selectAssetHandler}
							selected={multiSelectAsset.has(asset)}
						/>
					{:else}
						<ImmichThumbnail
							{asset}
							{thumbnailSize}
							publicSharedKey={sharedLink?.key}
							on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
							on:select={selectAssetHandler}
							selected={multiSelectAsset.has(asset)}
						/>
					{/if}
				{/each}
			</div>
		{/if}
	</section>
</section>

{#if isShowAssetViewer}
	<AssetViewer
		asset={selectedAsset}
		publicSharedKey={sharedLink?.key}
		on:navigate-previous={navigateAssetBackward}
		on:navigate-next={navigateAssetForward}
		on:close={closeViewer}
	/>
{/if}
