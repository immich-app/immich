<script lang="ts">
	import { page } from '$app/stores';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import type { PageData } from './$types';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
	import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { addAssetsToAlbum, bulkDownload } from '$lib/utils/asset-utils';
	import { AlbumResponseDto, api, AssetResponseDto, SharedLinkType } from '@api';
	import Close from 'svelte-material-icons/Close.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import ArchiveArrowUpOutline from 'svelte-material-icons/ArchiveArrowUpOutline.svelte';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import { locale } from '$lib/stores/preferences.store';
	export let data: PageData;

	// The GalleryViewer pushes it's own history state, which causes weird
	// behavior for history.back(). To prevent that we store the previous page
	// manually and navigate back to that.
	let previousRoute = '/explore';

	afterNavigate(({ from }) => {
		// Prevent setting previousRoute to the current page.
		if (from && from.route.id !== $page.route.id) {
			previousRoute = from.url.href;
		}
	});

	$: term = $page.url.searchParams.get('q') || data.term || '';

	let selectedAssets: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = selectedAssets.size > 0;
	$: isAllArchived = Array.from(selectedAssets).every((asset) => asset.isArchived);
	$: isAllFavorite = Array.from(selectedAssets).every((asset) => asset.isFavorite);

	let contextMenuPosition = { x: 0, y: 0 };
	let isShowCreateSharedLinkModal = false;
	let isShowAddMenu = false;
	let isShowAlbumPicker = false;
	let addToSharedAlbum = false;
	$: searchResultAssets = data.results.assets.items;

	const handleShowMenu = ({ x, y }: MouseEvent) => {
		contextMenuPosition = { x, y };
		isShowAddMenu = !isShowAddMenu;
	};

	const handleShowAlbumPicker = (shared: boolean) => {
		isShowAddMenu = false;
		isShowAlbumPicker = true;
		addToSharedAlbum = shared;
	};

	const handleAddToNewAlbum = (event: CustomEvent) => {
		isShowAlbumPicker = false;

		const { albumName }: { albumName: string } = event.detail;
		const assetIds = Array.from(selectedAssets).map((asset) => asset.id);
		api.albumApi.createAlbum({ albumName, assetIds }).then((response) => {
			const { id, albumName } = response.data;

			notificationController.show({
				message: `Added ${assetIds.length} to ${albumName}`,
				type: NotificationType.Info
			});

			clearMultiSelectAssetAssetHandler();

			goto('/albums/' + id);
		});
	};

	const handleAddToAlbum = async (event: CustomEvent<{ album: AlbumResponseDto }>) => {
		isShowAlbumPicker = false;
		const album = event.detail.album;

		const assetIds = Array.from(selectedAssets).map((asset) => asset.id);

		addAssetsToAlbum(album.id, assetIds).then(() => {
			clearMultiSelectAssetAssetHandler();
		});
	};

	const handleDownloadFiles = async () => {
		await bulkDownload('immich', Array.from(selectedAssets), () => {
			clearMultiSelectAssetAssetHandler();
		});
	};

	const toggleArchive = async () => {
		let cnt = 0;
		for (const asset of selectedAssets) {
			api.assetApi.updateAsset(asset.id, {
				isArchived: !isAllArchived
			});
			cnt = cnt + 1;

			asset.isArchived = !isAllArchived;

			searchResultAssets = searchResultAssets.map((a: AssetResponseDto) => {
				if (a.id === asset.id) {
					a = asset;
				}

				return a;
			});
		}

		notificationController.show({
			message: `${isAllArchived ? `Remove ${cnt} from` : `Add ${cnt} to`} archive`,
			type: NotificationType.Info
		});

		clearMultiSelectAssetAssetHandler();
	};

	const toggleFavorite = () => {
		isShowAddMenu = false;

		let cnt = 0;
		for (const asset of selectedAssets) {
			api.assetApi.updateAsset(asset.id, {
				isFavorite: !isAllFavorite
			});
			cnt = cnt + 1;

			asset.isFavorite = !isAllFavorite;

			searchResultAssets = searchResultAssets.map((a: AssetResponseDto) => {
				if (a.id === asset.id) {
					a = asset;
				}
				return a;
			});
		}

		notificationController.show({
			message: `${isAllFavorite ? `Remove ${cnt} from` : `Add ${cnt} to`} favorites`,
			type: NotificationType.Info
		});

		clearMultiSelectAssetAssetHandler();
	};

	const clearMultiSelectAssetAssetHandler = () => {
		selectedAssets = new Set();
	};

	const deleteSelectedAssetHandler = async () => {
		try {
			if (
				window.confirm(
					`Caution! Are you sure you want to delete ${selectedAssets.size} assets? This step also deletes assets in the album(s) to which they belong. You can not undo this action!`
				)
			) {
				const { data: deletedAssets } = await api.assetApi.deleteAsset({
					ids: Array.from(selectedAssets).map((a) => a.id)
				});

				for (const asset of deletedAssets) {
					if (asset.status == 'SUCCESS') {
						searchResultAssets = searchResultAssets.filter(
							(a: AssetResponseDto) => a.id != asset.id
						);
					}
				}

				clearMultiSelectAssetAssetHandler();
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error deleting assets, check console for more details'
			});
			console.error('Error deleteSelectedAssetHandler', e);
		}
	};
	const handleCreateSharedLink = async () => {
		isShowCreateSharedLinkModal = true;
	};

	const handleCloseSharedLinkModal = () => {
		clearMultiSelectAssetAssetHandler();
		isShowCreateSharedLinkModal = false;
	};
</script>

<section>
	{#if isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={clearMultiSelectAssetAssetHandler}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {selectedAssets.size.toLocaleString($locale)}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Share"
					logo={ShareVariantOutline}
					on:click={handleCreateSharedLink}
				/>

				<CircleIconButton
					title={isAllArchived ? 'Unarchive' : 'Archive'}
					logo={isAllArchived ? ArchiveArrowUpOutline : ArchiveArrowDownOutline}
					on:click={toggleArchive}
				/>

				<CircleIconButton
					title="Download"
					logo={CloudDownloadOutline}
					on:click={handleDownloadFiles}
				/>
				<CircleIconButton title="Add" logo={Plus} on:click={handleShowMenu} />
				<CircleIconButton
					title="Delete"
					logo={DeleteOutline}
					on:click={deleteSelectedAssetHandler}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{:else}
		<ControlAppBar on:close-button-click={() => goto(previousRoute)} backIcon={ArrowLeft}>
			<div class="w-full max-w-2xl flex-1 pl-4">
				<SearchBar grayTheme={false} value={term} />
			</div>
		</ControlAppBar>
	{/if}
</section>

<section class="relative pt-32 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
			{#if data.results?.assets?.items.length > 0}
				<div class="pl-4">
					<GalleryViewer
						assets={searchResultAssets}
						bind:selectedAssets
						viewFrom="search-page"
						showArchiveIcon={true}
					/>
				</div>
			{:else}
				<div
					class="flex items-center place-content-center w-full min-h-[calc(100vh_-_11rem)] dark:text-white"
				>
					<div class="flex flex-col content-center items-center text-center">
						<ImageOffOutline size="3.5em" />
						<p class="font-medium text-3xl mt-5">No results</p>
						<p class="text-base font-normal">Try a synonym or more general keyword</p>
					</div>
				</div>
			{/if}
		</section>
	</section>

	{#if isShowAddMenu}
		<ContextMenu {...contextMenuPosition} on:clickoutside={() => (isShowAddMenu = false)}>
			<div class="flex flex-col rounded-lg ">
				<MenuOption
					on:click={toggleFavorite}
					text={isAllFavorite ? 'Remove from favorites' : 'Add to favorites'}
				/>
				<MenuOption on:click={() => handleShowAlbumPicker(false)} text="Add to Album" />
				<MenuOption on:click={() => handleShowAlbumPicker(true)} text="Add to Shared Album" />
			</div>
		</ContextMenu>
	{/if}

	{#if isShowAlbumPicker}
		<AlbumSelectionModal
			shared={addToSharedAlbum}
			on:newAlbum={handleAddToNewAlbum}
			on:newSharedAlbum={handleAddToNewAlbum}
			on:album={handleAddToAlbum}
			on:close={() => (isShowAlbumPicker = false)}
		/>
	{/if}

	{#if isShowCreateSharedLinkModal}
		<CreateSharedLinkModal
			sharedAssets={Array.from(selectedAssets)}
			shareType={SharedLinkType.Individual}
			on:close={handleCloseSharedLinkModal}
		/>
	{/if}
</section>
