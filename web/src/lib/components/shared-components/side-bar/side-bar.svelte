<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '@api';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import { AppRoute } from '../../../constants';
	import LoadingSpinner from '../loading-spinner.svelte';
	import StatusBox from '../status-box.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import SideBarSection from './side-bar-section.svelte';

	let isCollapsed: boolean;

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
			const { data: assets } = await api.assetApi.getAllAssets(true, undefined);

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
</script>

<SideBarSection bind:isCollapsed>
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

	<div
		class="text-xs md:pb-2 md:p-5 p-6 pb-[1.2rem] dark:text-immich-dark-fg transition-all duration-200"
	>
		<p class={isCollapsed ? 'hidden' : 'block'}>LIBRARY</p>
		<hr class={isCollapsed ? 'block mt-2 mb-[0.45rem]' : 'hidden'} />
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
	<a data-sveltekit-preload-data="hover" href={AppRoute.ARCHIVE} draggable="false">
		<SideBarButton
			title="Archive"
			logo={ArchiveArrowDownOutline}
			isSelected={$page.route.id === '/(user)/archive'}
			{isCollapsed}
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
		<StatusBox {isCollapsed} />
	</div>
</SideBarSection>
