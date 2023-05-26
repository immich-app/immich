<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '@api';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import AccountMultiple from 'svelte-material-icons/AccountMultiple.svelte';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageMultipleOutline from 'svelte-material-icons/ImageMultipleOutline.svelte';
	import ImageMultiple from 'svelte-material-icons/ImageMultiple.svelte';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import Map from 'svelte-material-icons/Map.svelte';
	import HeartMultipleOutline from 'svelte-material-icons/HeartMultipleOutline.svelte';
	import HeartMultiple from 'svelte-material-icons/HeartMultiple.svelte';
	import { AppRoute } from '../../../constants';
	import LoadingSpinner from '../loading-spinner.svelte';
	import StatusBox from '../status-box.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import SideBarSection from './side-bar-section.svelte';

	const getAssetCount = async () => {
		const { data: allAssetCount } = await api.assetApi.getAssetCountByUserId();
		const { data: archivedCount } = await api.assetApi.getArchivedAssetCountByUserId();

		return {
			videos: allAssetCount.videos - archivedCount.videos,
			photos: allAssetCount.photos - archivedCount.photos
		};
	};

	const getFavoriteCount = async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets({ isFavorite: true });

			return {
				favorites: assets.length
			};
		} catch {
			return {
				favorites: 0
			};
		}
	};

	const getAlbumCount = async () => {
		try {
			const { data: albumCount } = await api.albumApi.getAlbumCountByUserId();
			return {
				shared: albumCount.shared,
				sharing: albumCount.sharing,
				owned: albumCount.owned
			};
		} catch {
			return {
				shared: 0,
				sharing: 0,
				owned: 0
			};
		}
	};

	const getArchivedAssetsCount = async () => {
		try {
			const { data: assetCount } = await api.assetApi.getArchivedAssetCountByUserId();

			return {
				videos: assetCount.videos,
				photos: assetCount.photos
			};
		} catch {
			return {
				videos: 0,
				photos: 0
			};
		}
	};

	const isFavoritesSelected = $page.route.id === '/(user)/favorites';
	const isPhotosSelected = $page.route.id === '/(user)/photos';
	const isSharingSelected = $page.route.id === '/(user)/sharing';
</script>

<SideBarSection>
	<a
		data-sveltekit-preload-data="hover"
		data-sveltekit-noscroll
		href={AppRoute.PHOTOS}
		draggable="false"
	>
		<SideBarButton
			title="Photos"
			logo={isPhotosSelected ? ImageMultiple : ImageMultipleOutline}
			isSelected={isPhotosSelected}
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
		/>
	</a>
	<a data-sveltekit-preload-data="hover" href={AppRoute.MAP} draggable="false">
		<SideBarButton title="Map" logo={Map} isSelected={$page.route.id === '/(user)/map'} />
	</a>
	<a data-sveltekit-preload-data="hover" href={AppRoute.SHARING} draggable="false">
		<SideBarButton
			title="Sharing"
			logo={isSharingSelected ? AccountMultiple : AccountMultipleOutline}
			isSelected={isSharingSelected}
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

	<div class="text-xs dark:text-immich-dark-fg transition-all duration-200">
		<p class="p-6 hidden md:block group-hover:sm:block">LIBRARY</p>
		<hr class="mt-8 mb-[31px] mx-4 block md:hidden group-hover:sm:hidden" />
	</div>
	<a data-sveltekit-preload-data="hover" href={AppRoute.FAVORITES} draggable="false">
		<SideBarButton
			title="Favorites"
			logo={isFavoritesSelected ? HeartMultiple : HeartMultipleOutline}
			isSelected={isFavoritesSelected}
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
			flippedLogo={true}
			isSelected={$page.route.id === '/(user)/albums'}
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
	<a data-sveltekit-preload-data="hover" href={AppRoute.ARCHIVE} draggable="false">
		<SideBarButton
			title="Archive"
			logo={ArchiveArrowDownOutline}
			isSelected={$page.route.id === '/(user)/archive'}
		>
			<svelte:fragment slot="moreInformation">
				{#await getArchivedAssetsCount()}
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

	<!-- Status Box -->
	<div class="mb-6 mt-auto">
		<StatusBox />
	</div>
</SideBarSection>
