<script lang="ts">
	import { goto } from '$app/navigation';
	import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
	import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadFiles from '$lib/components/photos-page/actions/download-files.svelte';
	import MoveToArchive from '$lib/components/photos-page/actions/move-to-archive.svelte';
	import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import OptionAddToAlbum from '$lib/components/photos-page/menu-options/option-add-to-album.svelte';
	import OptionAddToFavorites from '$lib/components/photos-page/menu-options/option-add-to-favorites.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { AppRoute } from '$lib/constants';
	import { handleError } from '$lib/utils/handle-error';
	import { AssetResponseDto, api } from '@api';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let isEditName = false;

	let multiSelectAsset: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = multiSelectAsset.size > 0;

	const handleNameChange = async (name: string) => {
		try {
			isEditName = false;
			data.person.name = name;
			await api.personApi.updatePerson(data.person.id, { name });
		} catch (error) {
			handleError(error, 'Unable to save name');
		}
	};

	const handleUnselectAsset = (assetId: string) => {
		const asset = data.assets.find((asset: AssetResponseDto) => asset.id === assetId);
		if (asset && multiSelectAsset.has(asset)) {
			multiSelectAsset.delete(asset);
		}
	};
</script>

{#if isMultiSelectionMode}
	<AssetSelectControlBar
		assets={multiSelectAsset}
		clearSelect={() => (multiSelectAsset = new Set())}
	>
		<CreateSharedLink />
		<MoveToArchive onAssetArchive={(asset) => handleUnselectAsset(asset.id)} />
		<DownloadFiles filename={data.person.name} />
		<AssetSelectContextMenu icon={Plus} title="Add">
			<OptionAddToFavorites />
			<OptionAddToAlbum />
			<OptionAddToAlbum shared />
		</AssetSelectContextMenu>
		<DeleteAssets onAssetDelete={handleUnselectAsset} />
	</AssetSelectControlBar>
{:else}
	<ControlAppBar
		showBackButton
		backIcon={ArrowLeft}
		on:close-button-click={() => goto(AppRoute.EXPLORE)}
	/>
{/if}

<!-- Face information block -->
<section class="pt-24 px-4 sm:px-6 flex place-items-center">
	{#if isEditName}
		<EditNameInput
			person={data.person}
			on:change={(event) => handleNameChange(event.detail)}
			on:blur={() => (isEditName = false)}
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
			{#if data.assets.length > 0}
				<GalleryViewer
					assets={data.assets}
					viewFrom="search-page"
					showArchiveIcon={true}
					bind:selectedAssets={multiSelectAsset}
				/>
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
</section>
