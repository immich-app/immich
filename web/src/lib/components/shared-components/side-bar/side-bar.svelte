<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '@api';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import { AppRoute } from '../../../constants';
	import LoadingSpinner from '../loading-spinner.svelte';
	import StatusBox from '../status-box.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import { locale } from '$lib/stores/preferences.store';

	export let isCollapsed: boolean;

	const getAssetCount = async () => {
		const { data: assetCount } = await api.assetApi.getAssetCountByUserId();

		return {
			videos: assetCount.videos,
			photos: assetCount.photos
		};
	};

	const getFavoriteCount = async () => {
		const { data: assets } = await api.assetApi.getAllAssets(true);

		return {
			favorites: assets.length
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

	const handleResize = () => {
		if (innerWidth > 768) {
			isCollapsed = false;
		} else {
			isCollapsed = true;
		}
	};

	//Set the initial state of the sidebar to collapsed or not
	$: isCollapsed = true;
	//if screen is resized to be larger than 768px, set the sidebar to not collapsed
</script>

<svelte:window on:resize={handleResize} />

<section
	id="sidebar"
	on:mouseover={() => (isCollapsed = false)}
	on:focus={() => (isCollapsed = false)}
	on:mouseleave={() => (isCollapsed = true)}
	class={`flex flex-col gap-1 pt-8 pr-6 bg-immich-bg dark:bg-immich-dark-bg transition-[width] duration-1000 ${
		isCollapsed ? 'w-24' : 'w-64'
	}`}
>
	<a
		data-sveltekit-preload-data="hover"
		data-sveltekit-noscroll
		href={AppRoute.PHOTOS}
		draggable="false"
	>
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			isSelected={$page.route.id === '/(user)/photos'}
			{isCollapsed}
		>
			<svelte:fragment slot="moreInformation">
				{#await getAssetCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{data.videos.toLocaleString($locale)} Videos</p>
						<p>{data.photos.toLocaleString($locale)} Photos</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>
	<a
		data-sveltekit-preload-data="hover"
		data-sveltekit-noscroll
		href={AppRoute.EXPLORE}
		draggable="false"
	>
		<SideBarButton
			title="Explore"
			logo={Magnify}
			isSelected={$page.route.id === '/(user)/explore'}
			{isCollapsed}
		/>
	</a>
	<a data-sveltekit-preload-data="hover" href={AppRoute.SHARING} draggable="false">
		<SideBarButton
			title="Sharing"
			logo={AccountMultipleOutline}
			isSelected={$page.route.id === '/(user)/sharing'}
			{isCollapsed}
		>
			<svelte:fragment slot="moreInformation">
				{#await getAlbumCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{(data.shared + data.sharing).toLocaleString($locale)} Albums</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>

	<div class="text-xs md:pb-2 md:p-5 p-6 pb-[1.2rem] dark:text-immich-dark-fg">
		<p class="md:block hidden">LIBRARY</p>
		<hr class="md:hidden block" />
	</div>
	<a data-sveltekit-preload-data="hover" href={AppRoute.FAVORITES} draggable="false">
		<SideBarButton
			title="Favorites"
			logo={StarOutline}
			isSelected={$page.route.id == '/(user)/favorites'}
			{isCollapsed}
		>
			<svelte:fragment slot="moreInformation">
				{#await getFavoriteCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{data.favorites} Favorites</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>
	<a data-sveltekit-preload-data="hover" href={AppRoute.ALBUMS} draggable="false">
		<SideBarButton
			title="Albums"
			logo={ImageAlbum}
			isSelected={$page.route.id === '/(user)/albums'}
			{isCollapsed}
		>
			<svelte:fragment slot="moreInformation">
				{#await getAlbumCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{data.owned.toLocaleString($locale)} Albums</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>

	<!-- Status Box -->
	<div class="mb-6 mt-auto">
		<StatusBox {isCollapsed} />
	</div>
</section>
