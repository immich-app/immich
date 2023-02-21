<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '@api';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import { AppRoute } from '../../../constants';
	import LoadingSpinner from '../loading-spinner.svelte';
	import StatusBox from '../status-box.svelte';
	import SideBarButton from './side-bar-button.svelte';

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

	const locale = navigator.language;
</script>

<section id="sidebar" class="flex flex-col gap-1 pt-8 pr-6 bg-immich-bg dark:bg-immich-dark-bg">
	<a
		data-sveltekit-preload-data="hover"
		data-sveltekit-noscroll
		href={AppRoute.PHOTOS}
		draggable="false"
	>
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			isSelected={$page.route.id === AppRoute.PHOTOS}
		>
			<svelte:fragment slot="moreInformation">
				{#await getAssetCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{data.videos.toLocaleString(locale)} Videos</p>
						<p>{data.photos.toLocaleString(locale)} Photos</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>
	<a data-sveltekit-preload-data="hover" href={AppRoute.SHARING} draggable="false">
		<SideBarButton
			title="Sharing"
			logo={AccountMultipleOutline}
			isSelected={$page.route.id === AppRoute.SHARING}
		>
			<svelte:fragment slot="moreInformation">
				{#await getAlbumCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{(data.shared + data.sharing).toLocaleString(locale)} Albums</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>

	<div class="text-xs p-5 pb-2 dark:text-immich-dark-fg">
		<p>LIBRARY</p>
	</div>
	<a data-sveltekit-preload-data="hover" href={AppRoute.FAVORITES} draggable="false">
		<SideBarButton
			title="Favorites"
			logo={StarOutline}
			isSelected={$page.route.id == AppRoute.FAVORITES}
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
		<SideBarButton title="Albums" logo={ImageAlbum} isSelected={$page.route.id === AppRoute.ALBUMS}>
			<svelte:fragment slot="moreInformation">
				{#await getAlbumCount()}
					<LoadingSpinner />
				{:then data}
					<div>
						<p>{data.owned.toLocaleString(locale)} Albums</p>
					</div>
				{/await}
			</svelte:fragment>
		</SideBarButton>
	</a>

	<!-- Status Box -->
	<div class="mb-6 mt-auto">
		<StatusBox />
	</div>
</section>
