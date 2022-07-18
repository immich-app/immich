<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { AlbumResponseDto, AssetResponseDto, ThumbnailFormat } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import AssetViewer from '../asset-viewer/asset-viewer.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';

	const dispatch = createEventDispatcher();
	export let album: AlbumResponseDto;

	let isShowAssetViewer = false;
	let selectedAsset: AssetResponseDto;
	let currentViewAssetIndex = 0;

	let viewWidth: number;
	let thumbnailSize: number = 300;
	let border = '';
	let backUrl = '/albums';

	afterNavigate(({ from, to }) => {
		backUrl = from?.pathname ?? '/albums';
	});
	$: {
		if (album.assets.length < 6) {
			thumbnailSize = Math.floor(viewWidth / album.assets.length - album.assets.length);
		} else {
			thumbnailSize = Math.floor(viewWidth / 6 - 6);
		}
	}

	const getDateRange = () => {
		const startDate = new Date(album.assets[0].createdAt);
		const endDate = new Date(album.assets[album.assets.length - 1].createdAt);

		const startDateString = startDate.toLocaleDateString('us-EN', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		const endDateString = endDate.toLocaleDateString('us-EN', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		return `${startDateString} - ${endDateString}`;
	};

	onMount(() => {
		window.onscroll = (event: Event) => {
			if (window.pageYOffset > 80) {
				border = 'border border-gray-200 bg-gray-50';
			} else {
				border = '';
			}
		};
	});

	const viewAsset = (event: CustomEvent) => {
		const { assetId, deviceId }: { assetId: string; deviceId: string } = event.detail;

		currentViewAssetIndex = album.assets.findIndex((a) => a.id == assetId);
		selectedAsset = album.assets[currentViewAssetIndex];
		isShowAssetViewer = true;
		pushState(selectedAsset.id);
	};

	const navigateAssetForward = () => {
		try {
			if (currentViewAssetIndex < album.assets.length - 1) {
				currentViewAssetIndex++;
				selectedAsset = album.assets[currentViewAssetIndex];
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
				selectedAsset = album.assets[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			console.error(e);
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

<section class="w-screen h-screen bg-immich-bg">
	<div class="fixed top-0 w-full bg-immich-bg z-[100]">
		<div class={`flex justify-between rounded-lg ${border} p-2 mx-2 mt-2 transition-all`}>
			<a sveltekit:prefetch href={backUrl} title="Go Back">
				<button
					id="immich-circle-icon-button"
					class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
				>
					<ArrowLeft size="24" />
				</button>
			</a>
			<div class="right-button-group" title="Add Photos">
				<button
					id="immich-circle-icon-button"
					class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
					on:click={() => dispatch('click')}
				>
					<FileImagePlusOutline size="24" />
				</button>
			</div>
		</div>
	</div>

	<section class="m-6 py-[72px] px-[160px]">
		<p class="text-6xl text-immich-primary">
			{album.albumName}
		</p>

		<p class="my-4 text-sm text-gray-500">{getDateRange()}</p>

		{#if album.sharedUsers.length > 0}
			<div class="mb-4">
				{#each album.sharedUsers as user}
					<span class="mr-1">
						<CircleAvatar {user} />
					</span>
				{/each}
			</div>
		{/if}

		<div class="flex flex-wrap gap-1 w-full" bind:clientWidth={viewWidth}>
			{#each album.assets as asset}
				{#if album.assets.length < 7}
					<ImmichThumbnail
						{asset}
						{thumbnailSize}
						format={ThumbnailFormat.Jpeg}
						on:viewAsset={viewAsset}
					/>
				{:else}
					<ImmichThumbnail {asset} {thumbnailSize} on:viewAsset={viewAsset} />
				{/if}
			{/each}
		</div>
	</section>
</section>

<!-- Overlay Asset Viewer -->
{#if isShowAssetViewer}
	<AssetViewer
		asset={selectedAsset}
		on:navigate-backward={navigateAssetBackward}
		on:navigate-forward={navigateAssetForward}
		on:close={closeViewer}
	/>
{/if}
