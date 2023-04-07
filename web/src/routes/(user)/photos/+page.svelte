<script lang="ts">
	import { goto } from '$app/navigation';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
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
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import { assetStore } from '$lib/stores/assets.store';
	import { addAssetsToAlbum, bulkDownload } from '$lib/utils/asset-utils';
	import { AlbumResponseDto, api, SharedLinkType } from '@api';
	import Close from 'svelte-material-icons/Close.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let isShowCreateSharedLinkModal = false;
	const deleteSelectedAssetHandler = async () => {
		try {
			if (
				window.confirm(
					`Caution! Are you sure you want to delete ${$selectedAssets.size} assets? This step also deletes assets in the album(s) to which they belong. You can not undo this action!`
				)
			) {
				const { data: deletedAssets } = await api.assetApi.deleteAsset({
					ids: Array.from($selectedAssets).map((a) => a.id)
				});

				for (const asset of deletedAssets) {
					if (asset.status == 'SUCCESS') {
						assetStore.removeAsset(asset.id);
					}
				}

				assetInteractionStore.clearMultiselect();
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error deleting assets, check console for more details'
			});
			console.error('Error deleteSelectedAssetHandler', e);
		}
	};

	let contextMenuPosition = { x: 0, y: 0 };
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
		for (const asset of $selectedAssets) {
			if (!asset.isFavorite) {
				api.assetApi.updateAsset(asset.id, {
					isFavorite: true
				});
				assetStore.updateAsset(asset.id, true);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `Added ${cnt} to favorites`,
			type: NotificationType.Info
		});

		assetInteractionStore.clearMultiselect();
	};

	const handleShowAlbumPicker = (shared: boolean) => {
		isShowAddMenu = false;
		isShowAlbumPicker = true;
		addToSharedAlbum = shared;
	};

	const handleAddToNewAlbum = (event: CustomEvent) => {
		isShowAlbumPicker = false;

		const { albumName }: { albumName: string } = event.detail;
		const assetIds = Array.from($selectedAssets).map((asset) => asset.id);
		api.albumApi.createAlbum({ albumName, assetIds }).then((response) => {
			const { id, albumName } = response.data;

			notificationController.show({
				message: `Added ${assetIds.length} to ${albumName}`,
				type: NotificationType.Info
			});

			assetInteractionStore.clearMultiselect();

			goto('/albums/' + id);
		});
	};

	const handleAddToAlbum = async (event: CustomEvent<{ album: AlbumResponseDto }>) => {
		isShowAlbumPicker = false;
		const album = event.detail.album;

		const assetIds = Array.from($selectedAssets).map((asset) => asset.id);

		addAssetsToAlbum(album.id, assetIds).then(() => {
			assetInteractionStore.clearMultiselect();
		});
	};

	const handleDownloadFiles = async () => {
		await bulkDownload('immich', Array.from($selectedAssets), () => {
			assetInteractionStore.clearMultiselect();
		});
	};

	const handleCreateSharedLink = async () => {
		isShowCreateSharedLinkModal = true;
	};

	const handleCloseSharedLinkModal = () => {
		assetInteractionStore.clearMultiselect();
		isShowCreateSharedLinkModal = false;
	};
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectStoreState} showUploadButton>
	<svelte:fragment slot="header">
		{#if $isMultiSelectStoreState}
			<ControlAppBar
				on:close-button-click={() => assetInteractionStore.clearMultiselect()}
				backIcon={Close}
				tailwindClasses={'bg-white shadow-md'}
			>
				<svelte:fragment slot="leading">
					<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
						Selected {$selectedAssets.size.toLocaleString($locale)}
					</p>
				</svelte:fragment>
				<svelte:fragment slot="trailing">
					<CircleIconButton
						title="Share"
						logo={ShareVariantOutline}
						on:click={handleCreateSharedLink}
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
				sharedAssets={Array.from($selectedAssets)}
				shareType={SharedLinkType.Individual}
				on:close={handleCloseSharedLinkModal}
			/>
		{/if}
	</svelte:fragment>

	<AssetGrid slot="content" />
</UserPageLayout>
