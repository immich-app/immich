<script lang="ts">
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import { api, AssetResponseDto, SharedLinkResponseDto } from '@api';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import { goto } from '$app/navigation';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import Close from 'svelte-material-icons/Close.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let sharedLink: SharedLinkResponseDto;
	export let isOwned: boolean;

	let assets = sharedLink.assets;
	let selectedAssets: Set<AssetResponseDto> = new Set();

	$: isMultiSelectionMode = selectedAssets.size > 0;

	const clearMultiSelectAssetAssetHandler = () => {
		selectedAssets = new Set();
	};

	const downloadAssets = async (isAll: boolean) => {
		await bulkDownload(
			'immich-shared',
			isAll ? assets : Array.from(selectedAssets),
			() => {
				isMultiSelectionMode = false;
				clearMultiSelectAssetAssetHandler();
			},
			sharedLink?.key
		);
	};

	const handleUploadAssets = () => {
		openFileUploadDialog(undefined, sharedLink?.key, async (assetId) => {
			await api.assetApi.updateAssetsInSharedLink(
				{
					assetIds: [...assets.map((a) => a.id), assetId]
				},
				{
					params: {
						key: sharedLink?.key
					}
				}
			);

			notificationController.show({
				message: 'Add asset to shared link successfully',
				type: NotificationType.Info
			});
		});
	};

	const handleRemoveAssetsFromSharedLink = async () => {
		if (window.confirm('Do you want to remove selected assets from the shared link?')) {
			await api.assetApi.updateAssetsInSharedLink(
				{
					assetIds: assets.filter((a) => !selectedAssets.has(a)).map((a) => a.id)
				},
				{
					params: {
						key: sharedLink?.key
					}
				}
			);

			assets = assets.filter((a) => !selectedAssets.has(a));
			clearMultiSelectAssetAssetHandler();
		}
	};
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
	{#if isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={clearMultiSelectAssetAssetHandler}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {selectedAssets.size}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Download"
					on:click={() => downloadAssets(false)}
					logo={CloudDownloadOutline}
				/>
				{#if isOwned}
					<CircleIconButton
						title="Remove from album"
						on:click={handleRemoveAssetsFromSharedLink}
						logo={DeleteOutline}
					/>
				{/if}
			</svelte:fragment>
		</ControlAppBar>
	{:else}
		<ControlAppBar
			on:close-button-click={() => goto('/photos')}
			backIcon={ArrowLeft}
			showBackButton={false}
		>
			<svelte:fragment slot="leading">
				<a
					data-sveltekit-preload-data="hover"
					class="flex gap-2 place-items-center hover:cursor-pointer ml-6"
					href="https://immich.app"
				>
					<img src="/immich-logo.svg" alt="immich logo" height="30" width="30" draggable="false" />
					<h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">
						IMMICH
					</h1>
				</a>
			</svelte:fragment>

			<svelte:fragment slot="trailing">
				{#if sharedLink?.allowUpload}
					<CircleIconButton
						title="Add Photos"
						on:click={handleUploadAssets}
						logo={FileImagePlusOutline}
					/>
				{/if}

				<CircleIconButton
					title="Download"
					on:click={() => downloadAssets(true)}
					logo={FolderDownloadOutline}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{/if}
	<section class="flex flex-col my-[160px] px-6 sm:px-12 md:px-24 lg:px-40">
		<GalleryViewer {assets} key={sharedLink.key} bind:selectedAssets />
	</section>
</section>
