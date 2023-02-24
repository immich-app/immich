<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import {
		AlbumResponseDto,
		api,
		AssetResponseDto,
		SharedLinkResponseDto,
		SharedLinkType,
		UserResponseDto
	} from '@api';
	import { onMount } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import AssetSelection from './asset-selection.svelte';
	import UserSelectionModal from './user-selection-modal.svelte';
	import ShareInfoModal from './share-info-modal.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
	import { downloadAssets } from '$lib/stores/download';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';
	import ThumbnailSelection from './thumbnail-selection.svelte';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';

	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';
	import { browser } from '$app/environment';
	import { albumAssetSelectionStore } from '$lib/stores/album-asset-selection.store';
	import CreateSharedLinkModal from '../shared-components/create-share-link-modal/create-shared-link-modal.svelte';
	import ThemeButton from '../shared-components/theme-button.svelte';
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import { locale } from '$lib/stores/preferences.store';
	import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
	import ImmichLogo from '../shared-components/immich-logo.svelte';

	export let album: AlbumResponseDto;
	export let sharedLink: SharedLinkResponseDto | undefined = undefined;

	const { isAlbumAssetSelectionOpen } = albumAssetSelectionStore;

	let isShowAssetSelection = false;

	let isShowShareLinkModal = false;

	$: $isAlbumAssetSelectionOpen = isShowAssetSelection;
	$: {
		if (browser) {
			if (isShowAssetSelection) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = 'auto';
			}
		}
	}
	let isShowShareUserSelection = false;
	let isEditingTitle = false;
	let isCreatingSharedAlbum = false;
	let isShowShareInfoModal = false;
	let isShowAlbumOptions = false;
	let isShowThumbnailSelection = false;

	let backUrl = '/albums';
	let currentAlbumName = '';
	let currentUser: UserResponseDto;
	let titleInput: HTMLInputElement;
	let contextMenuPosition = { x: 0, y: 0 };

	$: isPublicShared = sharedLink;
	$: isOwned = currentUser?.id == album.ownerId;

	let multiSelectAsset: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = multiSelectAsset.size > 0;

	afterNavigate(({ from }) => {
		backUrl = from?.url.pathname ?? '/albums';

		if (from?.url.pathname === '/sharing') {
			isCreatingSharedAlbum = true;
		}
	});

	const albumDateFormat: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	};

	const getDateRange = () => {
		const startDate = new Date(album.assets[0].fileCreatedAt);
		const endDate = new Date(album.assets[album.assetCount - 1].fileCreatedAt);

		const startDateString = startDate.toLocaleDateString($locale, albumDateFormat);
		const endDateString = endDate.toLocaleDateString($locale, albumDateFormat);

		// If the start and end date are the same, only show one date
		return startDateString === endDateString
			? startDateString
			: `${startDateString} - ${endDateString}`;
	};

	onMount(async () => {
		currentAlbumName = album.albumName;

		try {
			const { data } = await api.userApi.getMyUserInfo();
			currentUser = data;
		} catch (e) {
			console.log('Error [getMyUserInfo - album-viewer] ', e);
		}
	});

	const clearMultiSelectAssetAssetHandler = () => {
		multiSelectAsset = new Set();
	};

	const removeSelectedAssetFromAlbum = async () => {
		if (window.confirm('Do you want to remove selected assets from the album?')) {
			try {
				const { data } = await api.albumApi.removeAssetFromAlbum(album.id, {
					assetIds: Array.from(multiSelectAsset).map((a) => a.id)
				});

				album = data;
				multiSelectAsset = new Set();
			} catch (e) {
				console.error('Error [album-viewer] [removeAssetFromAlbum]', e);
				notificationController.show({
					type: NotificationType.Error,
					message: 'Error removing assets from album, check console for more details'
				});
			}
		}
	};

	// Update Album Name
	$: {
		if (!isEditingTitle && currentAlbumName != album.albumName && isOwned) {
			api.albumApi
				.updateAlbumInfo(album.id, {
					albumName: album.albumName
				})
				.then(() => {
					currentAlbumName = album.albumName;
				})
				.catch((e) => {
					console.error('Error [updateAlbumInfo] ', e);
					notificationController.show({
						type: NotificationType.Error,
						message: "Error updating album's name, check console for more details"
					});
				});
		}
	}

	const createAlbumHandler = async (event: CustomEvent) => {
		const { assets }: { assets: AssetResponseDto[] } = event.detail;
		try {
			const { data } = await api.albumApi.addAssetsToAlbum(
				album.id,
				{
					assetIds: assets.map((a) => a.id)
				},
				sharedLink?.key
			);

			if (data.album) {
				album = data.album;
			}
			isShowAssetSelection = false;
		} catch (e) {
			console.error('Error [createAlbumHandler] ', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error creating album, check console for more details'
			});
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
			console.error('Error [addUserHandler] ', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error adding users to album, check console for more details'
			});
		}
	};

	const sharedUserDeletedHandler = async (event: CustomEvent) => {
		const { userId }: { userId: string } = event.detail;

		if (userId == 'me') {
			isShowShareInfoModal = false;
			goto(backUrl);
		}

		try {
			const { data } = await api.albumApi.getAlbumInfo(album.id);

			album = data;
			isShowShareInfoModal = false;
		} catch (e) {
			console.error('Error [sharedUserDeletedHandler] ', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error deleting share users, check console for more details'
			});
		}
	};

	const removeAlbum = async () => {
		if (
			window.confirm(
				`Are you sure you want to delete album ${album.albumName}? If the album is shared, other users will not be able to access it.`
			)
		) {
			try {
				await api.albumApi.deleteAlbum(album.id);
				goto(backUrl);
			} catch (e) {
				console.error('Error [userDeleteMenu] ', e);
				notificationController.show({
					type: NotificationType.Error,
					message: 'Error deleting album, check console for more details'
				});
			}
		}
	};

	const downloadAlbum = async () => {
		try {
			let skip = 0;
			let count = 0;
			let done = false;

			while (!done) {
				count++;

				const fileName = album.albumName + `${count === 1 ? '' : count}.zip`;

				$downloadAssets[fileName] = 0;

				let total = 0;

				const { data, status, headers } = await api.albumApi.downloadArchive(
					album.id,
					skip || undefined,
					sharedLink?.key,
					{
						responseType: 'blob',
						onDownloadProgress: function (progressEvent) {
							const request = this as XMLHttpRequest;
							if (!total) {
								total = Number(request.getResponseHeader('X-Immich-Content-Length-Hint')) || 0;
							}

							if (total) {
								const current = progressEvent.loaded;
								$downloadAssets[fileName] = Math.floor((current / total) * 100);
							}
						}
					}
				);

				const isNotComplete = headers['x-immich-archive-complete'] === 'false';
				const fileCount = Number(headers['x-immich-archive-file-count']) || 0;
				if (isNotComplete && fileCount > 0) {
					skip += fileCount;
				} else {
					done = true;
				}

				if (!(data instanceof Blob)) {
					return;
				}

				if (status === 200) {
					const fileUrl = URL.createObjectURL(data);
					const anchor = document.createElement('a');
					anchor.href = fileUrl;
					anchor.download = fileName;

					document.body.appendChild(anchor);
					anchor.click();
					document.body.removeChild(anchor);

					URL.revokeObjectURL(fileUrl);

					// Remove item from download list
					setTimeout(() => {
						const copy = $downloadAssets;
						delete copy[fileName];
						$downloadAssets = copy;
					}, 2000);
				}
			}
		} catch (e) {
			$downloadAssets = {};
			console.error('Error downloading file ', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error downloading file, check console for more details.'
			});
		}
	};

	const showAlbumOptionsMenu = ({ x, y }: MouseEvent) => {
		contextMenuPosition = { x, y };
		isShowAlbumOptions = !isShowAlbumOptions;
	};

	const setAlbumThumbnailHandler = (event: CustomEvent) => {
		const { asset }: { asset: AssetResponseDto } = event.detail;
		try {
			api.albumApi.updateAlbumInfo(album.id, {
				albumThumbnailAssetId: asset.id
			});
		} catch (e) {
			console.error('Error [setAlbumThumbnailHandler] ', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error setting album thumbnail, check console for more details'
			});
		}

		isShowThumbnailSelection = false;
	};

	const onSharedLinkClickHandler = () => {
		isShowShareUserSelection = false;
		isShowShareLinkModal = true;
	};

	const handleDownloadSelectedAssets = async () => {
		await bulkDownload(
			album.albumName,
			Array.from(multiSelectAsset),
			() => {
				isMultiSelectionMode = false;
				clearMultiSelectAssetAssetHandler();
			},
			sharedLink?.key
		);
	};
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
	<!-- Multiselection mode app bar -->
	{#if isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={clearMultiSelectAssetAssetHandler}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {multiSelectAsset.size.toLocaleString($locale)}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Download"
					on:click={handleDownloadSelectedAssets}
					logo={CloudDownloadOutline}
				/>
				{#if isOwned}
					<CircleIconButton
						title="Remove from album"
						on:click={removeSelectedAssetFromAlbum}
						logo={DeleteOutline}
					/>
				{/if}
			</svelte:fragment>
		</ControlAppBar>
	{/if}

	<!-- Default app bar -->
	{#if !isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={() => goto(backUrl)}
			backIcon={ArrowLeft}
			showBackButton={(!isPublicShared && isOwned) ||
				(!isPublicShared && !isOwned) ||
				(isPublicShared && isOwned)}
		>
			<svelte:fragment slot="leading">
				{#if isPublicShared && !isOwned}
					<a
						data-sveltekit-preload-data="hover"
						class="flex gap-2 place-items-center hover:cursor-pointer ml-6"
						href="https://immich.app"
					>
						<ImmichLogo height={30} width={30} />
						<h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">
							IMMICH
						</h1>
					</a>
				{/if}
			</svelte:fragment>

			<svelte:fragment slot="trailing">
				{#if album.assetCount > 0}
					{#if !sharedLink}
						<CircleIconButton
							title="Add Photos"
							on:click={() => (isShowAssetSelection = true)}
							logo={FileImagePlusOutline}
						/>
					{/if}

					{#if sharedLink?.allowUpload}
						<CircleIconButton
							title="Add Photos"
							on:click={() => openFileUploadDialog(album.id, sharedLink?.key)}
							logo={FileImagePlusOutline}
						/>
					{/if}

					<!-- Share and remove album -->
					{#if isOwned}
						<CircleIconButton
							title="Share"
							on:click={() => (isShowShareUserSelection = true)}
							logo={ShareVariantOutline}
						/>
						<CircleIconButton title="Remove album" on:click={removeAlbum} logo={DeleteOutline} />
					{/if}

					{#if !isPublicShared || (isPublicShared && sharedLink?.allowDownload)}
						<CircleIconButton
							title="Download"
							on:click={() => downloadAlbum()}
							logo={FolderDownloadOutline}
						/>
					{/if}

					{#if !isPublicShared}
						<CircleIconButton
							title="Album options"
							on:click={showAlbumOptionsMenu}
							logo={DotsVertical}
						/>
					{/if}

					{#if isPublicShared}
						<ThemeButton />
					{/if}
				{/if}

				{#if isCreatingSharedAlbum && album.sharedUsers.length == 0}
					<button
						disabled={album.assetCount == 0}
						on:click={() => (isShowShareUserSelection = true)}
						class="immich-text-button border bg-immich-primary dark:bg-immich-dark-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed dark:text-immich-dark-bg dark:border-immich-dark-gray"
						><span class="px-2">Share</span></button
					>
				{/if}
			</svelte:fragment>
		</ControlAppBar>
	{/if}

	<section class="flex flex-col my-[160px] px-6 sm:px-12 md:px-24 lg:px-40">
		<input
			on:keydown={(e) => {
				if (e.key == 'Enter') {
					isEditingTitle = false;
					titleInput.blur();
				}
			}}
			on:focus={() => (isEditingTitle = true)}
			on:blur={() => (isEditingTitle = false)}
			class={`transition-all text-6xl text-immich-primary dark:text-immich-dark-primary w-[99%] border-b-2 border-transparent outline-none ${
				isOwned ? 'hover:border-gray-400' : 'hover:border-transparent'
			} focus:outline-none focus:border-b-2 focus:border-immich-primary dark:focus:border-immich-dark-primary bg-immich-bg dark:bg-immich-dark-bg dark:focus:bg-immich-dark-gray`}
			type="text"
			bind:value={album.albumName}
			disabled={!isOwned}
			bind:this={titleInput}
		/>

		{#if album.assetCount > 0}
			<p class="my-4 text-sm text-gray-500 font-medium">{getDateRange()}</p>
		{/if}
		{#if album.shared}
			<div class="my-6 flex">
				{#each album.sharedUsers as user}
					{#key user.id}
						<span class="mr-1">
							<CircleAvatar {user} on:click={() => (isShowShareInfoModal = true)} />
						</span>
					{/key}
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

		{#if album.assetCount > 0}
			<GalleryViewer assets={album.assets} {sharedLink} bind:selectedAssets={multiSelectAsset} />
		{:else}
			<!-- Album is empty - Show asset selectection buttons -->
			<section id="empty-album" class=" mt-[200px] flex place-content-center place-items-center">
				<div class="w-[300px]">
					<p class="text-xs dark:text-immich-dark-fg">ADD PHOTOS</p>
					<button
						on:click={() => (isShowAssetSelection = true)}
						class="w-full py-8 border bg-immich-bg dark:bg-immich-dark-gray text-immich-fg dark:text-immich-dark-fg dark:hover:text-immich-dark-primary rounded-md mt-5 flex place-items-center gap-6 px-8 transition-all hover:bg-gray-100 hover:text-immich-primary dark:border-none"
					>
						<span class="text-text-immich-primary dark:text-immich-dark-primary"
							><Plus size="24" />
						</span>
						<span class="text-lg">Select photos</span>
					</button>
				</div>
			</section>
		{/if}
	</section>
</section>

{#if isShowAssetSelection}
	<AssetSelection
		albumId={album.id}
		assetsInAlbum={album.assets}
		on:go-back={() => (isShowAssetSelection = false)}
		on:create-album={createAlbumHandler}
	/>
{/if}

{#if isShowShareUserSelection}
	<UserSelectionModal
		{album}
		on:close={() => (isShowShareUserSelection = false)}
		on:add-user={addUserHandler}
		on:sharedlinkclick={onSharedLinkClickHandler}
		sharedUsersInAlbum={new Set(album.sharedUsers)}
	/>
{/if}

{#if isShowShareLinkModal}
	<CreateSharedLinkModal
		on:close={() => (isShowShareLinkModal = false)}
		shareType={SharedLinkType.Album}
		{album}
	/>
{/if}
{#if isShowShareInfoModal}
	<ShareInfoModal
		on:close={() => (isShowShareInfoModal = false)}
		{album}
		on:user-deleted={sharedUserDeletedHandler}
	/>
{/if}

{#if isShowAlbumOptions}
	<ContextMenu {...contextMenuPosition} on:clickoutside={() => (isShowAlbumOptions = false)}>
		{#if isOwned}
			<MenuOption
				on:click={() => {
					isShowThumbnailSelection = true;
					isShowAlbumOptions = false;
				}}
				text="Set album cover"
			/>
		{/if}
	</ContextMenu>
{/if}

{#if isShowThumbnailSelection}
	<ThumbnailSelection
		{album}
		on:close={() => (isShowThumbnailSelection = false)}
		on:thumbnail-selected={setAlbumThumbnailHandler}
	/>
{/if}
