<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
	import { goto } from '$app/navigation';

	import type { PageData } from './$types';

	import { openFileUploadDialog, UploadType } from '$lib/utils/file-uploader';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import CircleIconButton from '$lib/components/shared-components/circle-icon-button.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import { AlbumResponseDto, api } from '@api';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { assetStore } from '$lib/stores/assets.store';

	export let data: PageData;

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

	const handleShowMenu = (event: CustomEvent) => {
		contextMenuPosition = {
			x: event.detail.mouseEvent.x,
			y: event.detail.mouseEvent.y
		};

		isShowAddMenu = !isShowAddMenu;
	};

	const handleShowAlbumPicker = (shared: boolean) => {
		isShowAddMenu = false;
		isShowAlbumPicker = true;
		addToSharedAlbum = shared;
	};

	const handleAddToNewAlbum = () => {
		isShowAlbumPicker = false;

		const assetIds = Array.from($selectedAssets).map((asset) => asset.id);
		api.albumApi.createAlbum({ albumName: 'Untitled', assetIds }).then((response) => {
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
		api.albumApi.addAssetsToAlbum(album.id, { assetIds }).then(({ data: dto }) => {
			notificationController.show({
				message: `Added ${dto.successfullyAdded} to ${dto.album?.albumName}`,
				type: NotificationType.Info
			});

			assetInteractionStore.clearMultiselect();
		});
	};
</script>

<svelte:head>
	<title>Photos - Immich</title>
</svelte:head>

<section>
	{#if $isMultiSelectStoreState}
		<ControlAppBar
			on:close-button-click={() => assetInteractionStore.clearMultiselect()}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {$selectedAssets.size}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton title="Add" logo={Plus} on:click={handleShowMenu} />
				<CircleIconButton
					title="Delete"
					logo={DeleteOutline}
					on:click={deleteSelectedAssetHandler}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{:else}
		<NavigationBar
			user={data.user}
			on:uploadClicked={() => openFileUploadDialog(UploadType.GENERAL)}
		/>
	{/if}

	{#if isShowAddMenu}
		<ContextMenu {...contextMenuPosition} on:clickoutside={() => (isShowAddMenu = false)}>
			<div class="flex flex-col rounded-lg ">
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
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg dark:bg-immich-dark-bg"
>
	<SideBar />
	<AssetGrid />
</section>
