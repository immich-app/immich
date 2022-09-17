<script lang="ts">
	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import StatusBox from '../status-box.svelte';
	import { api } from '@api';
	import { fade } from 'svelte/transition';
	import LoadingSpinner from '../loading-spinner.svelte';

	let selectedAction: AppSideBarSelection;

	let showAssetCount = false;
	let showSharingCount = false;
	let showAlbumsCount = false;

	// let domCount = 0;
	onMount(async () => {
		if ($page.routeId == 'albums') {
			selectedAction = AppSideBarSelection.ALBUMS;
		} else if ($page.routeId == 'photos') {
			selectedAction = AppSideBarSelection.PHOTOS;
		} else if ($page.routeId == 'sharing') {
			selectedAction = AppSideBarSelection.SHARING;
		}

		// setInterval(() => {
		// 	domCount = document.getElementsByTagName('*').length;
		// }, 500);
	});

	const getAssetCount = async () => {
		const { data: assetCount } = await api.assetApi.getAssetCountByUserId();

		return {
			videos: assetCount.videos,
			photos: assetCount.photos
		};
	};

	const getAlbumCount = async () => {
		const { data: albumCount } = await api.albumApi.getAlbumCountByUserId();
		return {
			shared: albumCount.shared,
			sharing: albumCount.sharing,
			owned: albumCount.owned
		};
	};
</script>

<section id="sidebar" class="flex flex-col gap-1 pt-8 pr-6">
	<!-- {domCount} -->
	<a
		data-sveltekit-prefetch
		data-sveltekit-noscroll
		href={$page.routeId !== 'photos' ? `/photos` : null}
		class="relative"
	>
		<SideBarButton
			title={`Photos`}
			logo={ImageOutline}
			actionType={AppSideBarSelection.PHOTOS}
			isSelected={selectedAction === AppSideBarSelection.PHOTOS}
		/>
		<div
			id="asset-count-info"
			class="absolute right-4 top-[15px] z-40 text-xs hover:cursor-help"
			on:mouseenter={() => (showAssetCount = true)}
			on:mouseleave={() => (showAssetCount = false)}
		>
			<InformationOutline size={18} color="#989a9f" />
			{#if showAssetCount}
				<div
					transition:fade={{ duration: 200 }}
					id="asset-count-info-detail"
					class="w-32 rounded-lg p-4 shadow-lg bg-white absolute -right-[135px] top-0 z-[9999] flex place-items-center place-content-center"
				>
					{#await getAssetCount()}
						<LoadingSpinner />
					{:then data}
						<div>
							<p>{data.videos} Videos</p>
							<p>{data.photos} Photos</p>
						</div>
					{/await}
				</div>
			{/if}
		</div>
	</a>

	<a
		data-sveltekit-prefetch
		href={$page.routeId !== 'sharing' ? `/sharing` : null}
		class="relative"
	>
		<SideBarButton
			title="Sharing"
			logo={AccountMultipleOutline}
			actionType={AppSideBarSelection.SHARING}
			isSelected={selectedAction === AppSideBarSelection.SHARING}
		/>
		<div
			id="sharing-count-info"
			class="absolute right-4 top-[15px] z-40 text-xs hover:cursor-help"
			on:mouseenter={() => (showSharingCount = true)}
			on:mouseleave={() => (showSharingCount = false)}
		>
			<InformationOutline size={18} color="#989a9f" />
			{#if showSharingCount}
				<div
					transition:fade={{ duration: 200 }}
					id="asset-count-info-detail"
					class="w-24 rounded-lg p-4 shadow-lg bg-white absolute -right-[105px] top-0 z-[9999] flex place-items-center place-content-center"
				>
					{#await getAlbumCount()}
						<LoadingSpinner />
					{:then data}
						<div>
							<p>{data.shared + data.sharing} Albums</p>
						</div>
					{/await}
				</div>
			{/if}
		</div>
	</a>
	<div class="text-xs ml-5 my-4">
		<p>LIBRARY</p>
	</div>
	<a data-sveltekit-prefetch href={$page.routeId !== 'albums' ? `/albums` : null} class="relative">
		<SideBarButton
			title="Albums"
			logo={ImageAlbum}
			actionType={AppSideBarSelection.ALBUMS}
			isSelected={selectedAction === AppSideBarSelection.ALBUMS}
		/>

		<div
			id="album-count-info"
			class="absolute right-4 top-[15px] z-40 text-xs hover:cursor-help"
			on:mouseenter={() => (showAlbumsCount = true)}
			on:mouseleave={() => (showAlbumsCount = false)}
		>
			<InformationOutline size={18} color="#989a9f" />
			{#if showAlbumsCount}
				<div
					transition:fade={{ duration: 200 }}
					id="asset-count-info-detail"
					class="w-24 rounded-lg p-4 shadow-lg bg-white absolute -right-[105px] top-0 z-[9999] flex place-items-center place-content-center"
				>
					{#await getAlbumCount()}
						<LoadingSpinner />
					{:then data}
						<div>
							<p>{data.owned} Albums</p>
						</div>
					{/await}
				</div>
			{/if}
		</div>
	</a>

	<!-- Status Box -->
	<div class="mb-6 mt-auto">
		<StatusBox />
	</div>
</section>
