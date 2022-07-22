<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AlbumResponseDto, api, AssetResponseDto, ThumbnailFormat, UserResponseDto } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import AssetViewer from '../asset-viewer/asset-viewer.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import AssetSelection from './asset-selection.svelte';
	import _ from 'lodash-es';
	import { assets } from '$app/paths';
	import UserSelection from './user-selection-modal.svelte';
	import AlbumAppBar from './album-app-bar.svelte';
	import UserSelectionModal from './user-selection-modal.svelte';

	const dispatch = createEventDispatcher();
	export let album: AlbumResponseDto;

	let isShowAssetViewer = false;
	let isShowAssetSelection = false;
	let isShowShareUserSelection = false;
	let isEditingTitle = false;
	let isCreatingSharedAlbum = false;

	let selectedAsset: AssetResponseDto;
	let currentViewAssetIndex = 0;

	let viewWidth: number;
	let thumbnailSize: number = 300;
	let border = '';
	let backUrl = '/albums';
	let currentAlbumName = '';
	let currentUser: UserResponseDto;
	let bodyElement: HTMLElement;

	$: isOwned = currentUser?.id == album.ownerId;

	afterNavigate(({ from }) => {
		backUrl = from?.pathname ?? '/albums';

		if (from?.pathname === '/sharing') {
			isCreatingSharedAlbum = true;
		}
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

		const timeFormatOption: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};

		const startDateString = startDate.toLocaleDateString('us-EN', timeFormatOption);
		const endDateString = endDate.toLocaleDateString('us-EN', timeFormatOption);
		return `${startDateString} - ${endDateString}`;
	};

	onMount(async () => {
		window.onscroll = (event: Event) => {
			if (window.pageYOffset > 80) {
				border = 'border border-gray-200 bg-gray-50';
			} else {
				border = '';
			}
		};

		currentAlbumName = album.albumName;

		try {
			const { data } = await api.userApi.getMyUserInfo();
			currentUser = data;
		} catch (e) {
			console.log('Error [getMyUserInfo - album-viewer] ', e);
		}
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

	// Update Album Name
	$: {
		if (!isEditingTitle && currentAlbumName != album.albumName && isOwned) {
			api.albumApi
				.updateAlbumInfo(album.id, {
					ownerId: album.ownerId,
					albumName: album.albumName
				})
				.then(() => {
					currentAlbumName = album.albumName;
				})
				.catch((e) => {
					console.log('Error [updateAlbumInfo] ', e);
				});
		}
	}

	const createAlbumHandler = async (event: CustomEvent) => {
		const { assets }: { assets: string[] } = event.detail;

		try {
			const { data } = await api.albumApi.addAssetsToAlbum(album.id, { assetIds: assets });
			album = data;

			isShowAssetSelection = false;
		} catch (e) {
			console.log('Error [createAlbumHandler] ', e);
		}
	};

	const addUserHandler = async (event: CustomEvent) => {
		const { selectedUsers }: { selectedUsers: UserResponseDto[] } = event.detail;

		try {
			const { data } = await api.albumApi.addUsersToAlbum(album.id, {
				sharedUserIds: Array.from(selectedUsers).map((u) => u.id)
			});

			album = data;

			isShowShareUserSelection = false;
		} catch (e) {
			console.log('Error [createAlbumHandler] ', e);
		}
	};

	// Prevent scrolling when modal is open
	$: {
		if (isShowShareUserSelection == true) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}
</script>

<svelte:body bind:this={bodyElement} />
<section class="bg-immich-bg relative">
	<AlbumAppBar on:close-button-click={() => goto(backUrl)} backIcon={ArrowLeft}>
		<svelte:fragment slot="trailing">
			{#if album.assets.length > 0}
				<button
					id="immich-circle-icon-button"
					class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
					on:click={() => (isShowAssetSelection = true)}
				>
					<FileImagePlusOutline size="24" />
				</button>
			{/if}

			{#if isCreatingSharedAlbum && album.sharedUsers.length == 0}
				<button
					disabled={album.assets.length == 0}
					on:click={() => (isShowShareUserSelection = true)}
					class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed"
					><span class="px-2">Share</span></button
				>
			{/if}
		</svelte:fragment>
	</AlbumAppBar>

	<section class="m-auto my-[160px] w-[60%]">
		<input
			on:focus={() => (isEditingTitle = true)}
			on:blur={() => (isEditingTitle = false)}
			class={`transition-all text-6xl text-immich-primary w-[99%] border-b-2 border-transparent outline-none ${
				isOwned ? 'hover:border-gray-400' : 'hover:border-transparent'
			} focus:outline-none focus:border-b-2 focus:border-immich-primary bg-immich-bg`}
			type="text"
			bind:value={album.albumName}
			disabled={!isOwned}
		/>

		{#if album.assets.length > 0}
			<p class="my-4 text-sm text-gray-500">{getDateRange()}</p>
		{/if}

		{#if album.shared}
			<div class="my-4 flex">
				{#each album.sharedUsers as user}
					<span class="mr-1">
						<CircleAvatar {user} />
					</span>
				{/each}

				<button
					style:display={isOwned ? 'block' : 'none'}
					on:click={() => (isShowShareUserSelection = true)}
					title="Add more users"
					class="h-12 w-12 border bg-white transition-colors hover:bg-gray-300 text-3xl flex place-items-center place-content-center rounded-full"
					>+</button
				>
			</div>
		{/if}

		{#if album.assets.length > 0}
			<div class="flex flex-wrap gap-1 w-full" bind:clientWidth={viewWidth}>
				{#each album.assets as asset}
					{#if album.assets.length < 7}
						<ImmichThumbnail
							{asset}
							{thumbnailSize}
							format={ThumbnailFormat.Jpeg}
							on:click={viewAsset}
						/>
					{:else}
						<ImmichThumbnail {asset} {thumbnailSize} on:click={viewAsset} />
					{/if}
				{/each}
			</div>
		{:else}
			<!-- Album is empty - Show asset selectection buttons -->
			<section id="empty-album" class=" mt-[200px] flex place-content-center place-items-center">
				<div class="w-[300px]">
					<p class="text-xs">ADD PHOTOS</p>
					<button
						on:click={() => (isShowAssetSelection = true)}
						class="w-full py-8 border bg-white rounded-md mt-5 flex place-items-center gap-6 px-8 transition-all hover:bg-gray-100 hover:text-immich-primary"
					>
						<span><Plus color="#4250af" size="24" /> </span>
						<span class="text-lg text-immich-fg">Select photos</span>
					</button>
				</div>
			</section>
		{/if}
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

{#if isShowAssetSelection}
	<AssetSelection
		assetsInAlbum={album.assets}
		on:go-back={() => (isShowAssetSelection = false)}
		on:create-album={createAlbumHandler}
	/>
{/if}

{#if isShowShareUserSelection}
	<UserSelectionModal
		on:close={() => (isShowShareUserSelection = false)}
		on:add-user={addUserHandler}
		sharedUsersInAlbum={new Set(album.sharedUsers)}
	/>
{/if}
