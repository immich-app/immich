<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
	import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
	import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
	import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
	import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
	import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { AppRoute } from '$lib/constants';
	import { handleError } from '$lib/utils/handle-error';
	import { AssetResponseDto, api } from '@api';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import SelectAll from 'svelte-material-icons/SelectAll.svelte';

	export let data: PageData;

	let isEditName = false;
	let previousRoute: string = AppRoute.EXPLORE;
	let selectedAssets: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = selectedAssets.size > 0;
	$: isAllArchive = Array.from(selectedAssets).every((asset) => asset.isArchived);
	$: isAllFavorite = Array.from(selectedAssets).every((asset) => asset.isFavorite);

	afterNavigate(({ from }) => {
		// Prevent setting previousRoute to the current page.
		if (from && from.route.id !== $page.route.id) {
			previousRoute = from.url.href;
		}
	});

	const handleNameChange = async (name: string) => {
		try {
			isEditName = false;
			data.person.name = name;
			await api.personApi.updatePerson({ id: data.person.id, personUpdateDto: { name } });
		} catch (error) {
			handleError(error, 'Unable to save name');
		}
	};

	const onAssetDelete = (assetId: string) => {
		data.assets = data.assets.filter((asset: AssetResponseDto) => asset.id !== assetId);
	};
	const handleSelectAll = () => {
		selectedAssets = new Set(data.assets);
	};
</script>

{#if isMultiSelectionMode}
	<AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
		<CreateSharedLink />
		<CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
		<AssetSelectContextMenu icon={Plus} title="Add">
			<AddToAlbum />
			<AddToAlbum shared />
		</AssetSelectContextMenu>
		<DeleteAssets {onAssetDelete} />
		<AssetSelectContextMenu icon={DotsVertical} title="Add">
			<DownloadAction menuItem />
			<FavoriteAction menuItem removeFavorite={isAllFavorite} />
			<ArchiveAction
				menuItem
				unarchive={isAllArchive}
				onAssetArchive={(asset) => onAssetDelete(asset.id)}
			/>
		</AssetSelectContextMenu>
	</AssetSelectControlBar>
{:else}
	<ControlAppBar
		showBackButton
		backIcon={ArrowLeft}
		on:close-button-click={() => goto(previousRoute)}
	/>
{/if}

<!-- Face information block -->
<section class="pt-24 px-4 sm:px-6 flex place-items-center">
	{#if isEditName}
		<EditNameInput
			person={data.person}
			on:change={(event) => handleNameChange(event.detail)}
			on:cancel={() => (isEditName = false)}
		/>
	{:else}
		<ImageThumbnail
			circle
			shadow
			url={api.getPeopleThumbnailUrl(data.person.id)}
			altText={data.person.name}
			widthStyle="3.375rem"
			heightStyle="3.375rem"
		/>
		<button
			title="Edit name"
			class="px-4 text-immich-primary dark:text-immich-dark-primary"
			on:click={() => (isEditName = true)}
		>
			{#if data.person.name}
				<p class="font-medium py-2">{data.person.name}</p>
			{:else}
				<p class="font-medium w-fit">Add a name</p>
				<p class="text-sm text-gray-500 dark:text-immich-gray">
					Find them fast by name with search
				</p>
			{/if}
		</button>
	{/if}
</section>

<!-- Gallery Block -->
<section class="relative pt-8 sm:px-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
			<GalleryViewer
				assets={data.assets}
				viewFrom="search-page"
				showArchiveIcon={true}
				bind:selectedAssets
			/>
		</section>
	</section>
</section>
