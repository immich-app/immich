<script lang="ts">
	import { goto } from '$app/navigation';
	import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
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
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { handleError } from '$lib/utils/handle-error';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { archivedAsset } from '$lib/stores/archived-asset.store';

	export let data: PageData;

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(undefined, true);
			$archivedAsset = assets;
		} catch {
			handleError(Error, 'Unable to load archived assets');
		}
	});

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
						$archivedAsset = $archivedAsset.filter((a) => a.id != asset.id);
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

	$: isMultiSelectionMode = selectedAssets.size > 0;

	let selectedAssets: Set<AssetResponseDto> = new Set();

	let contextMenuPosition = { x: 0, y: 0 };
	let isShowCreateSharedLinkModal = false;
	let isShowAddMenu = false;
	let isShowAlbumPicker = false;
	let addToSharedAlbum = false;

	const handleShowMenu = ({ x, y }: MouseEvent) => {
		contextMenuPosition = { x, y };
		isShowAddMenu = !isShowAddMenu;
	};

	const handleAddToFavorites = () => {
		isShowAddMenu = false;

		let cnt = 0;
		for (const asset of selectedAssets) {
			if (!asset.isFavorite) {
				api.assetApi.updateAsset(asset.id, {
					isFavorite: true
				});
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `Added ${cnt} to favorites`,
			type: NotificationType.Info
		});

		clearMultiSelectAssetAssetHandler();
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

	const handleUnarchive = async () => {
		let cnt = 0;
		for (const asset of selectedAssets) {
			if (asset.isArchived) {
				api.assetApi.updateAsset(asset.id, {
					isArchived: false
				});
				cnt = cnt + 1;

				$archivedAsset = $archivedAsset.filter((a) => a.id != asset.id);
			}
		}

		notificationController.show({
			message: `Removed ${cnt} from archive`,
			type: NotificationType.Info
		});

		clearMultiSelectAssetAssetHandler();
	};

	const handleCreateSharedLink = async () => {
		isShowCreateSharedLinkModal = true;
	};

	const handleCloseSharedLinkModal = () => {
		clearMultiSelectAssetAssetHandler();
		isShowCreateSharedLinkModal = false;
	};
</script>

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode}>
	<!-- Empty Message -->
	{#if $archivedAsset.length === 0}
		<EmptyPlaceholder
			text="Archive photos and videos to hide them from your Photos view"
			alt="Empty archive"
		/>
	{/if}

	<svelte:fragment slot="header">
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
						title="Unarchive"
						logo={ArchiveArrowUpOutline}
						on:click={handleUnarchive}
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
		{/if}

		{#if isShowAddMenu}
			<ContextMenu {...contextMenuPosition} on:clickoutside={() => (isShowAddMenu = false)}>
				<div class="flex flex-col rounded-lg ">
					<MenuOption on:click={handleAddToFavorites} text="Add to Favorites" />
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
	</svelte:fragment>

	<GalleryViewer assets={$archivedAsset} bind:selectedAssets viewFrom="archive-page" />
</UserPageLayout>
