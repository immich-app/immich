<script lang="ts">
	import { goto } from '$app/navigation';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import { api, AssetResponseDto, SharedLinkResponseDto } from '@api';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import DownloadAction from '../photos-page/actions/download-action.svelte';
	import RemoveFromSharedLink from '../photos-page/actions/remove-from-shared-link.svelte';
	import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
	import ImmichLogo from '../shared-components/immich-logo.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let sharedLink: SharedLinkResponseDto;
	export let isOwned: boolean;

	let selectedAssets: Set<AssetResponseDto> = new Set();

	$: assets = sharedLink.assets;
	$: isMultiSelectionMode = selectedAssets.size > 0;

	const clearMultiSelectAssetAssetHandler = () => {
		selectedAssets = new Set();
	};

	const downloadAssets = async () => {
		await bulkDownload('immich-shared', assets, undefined, sharedLink?.key);
	};

	const handleUploadAssets = async () => {
		try {
			const results = await openFileUploadDialog(undefined, sharedLink?.key);

			const assetIds = results.filter((id) => !!id) as string[];

			await api.assetApi.addAssetsToSharedLink({
				addAssetsDto: {
					assetIds
				},
				key: sharedLink?.key
			});

			notificationController.show({
				message: `Successfully add ${assetIds.length} to the shared link`,
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('handleUploadAssets', e);
		}
	};
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
	{#if isMultiSelectionMode}
		<AssetSelectControlBar assets={selectedAssets} clearSelect={clearMultiSelectAssetAssetHandler}>
			<DownloadAction filename="immich-shared" sharedLinkKey={sharedLink.key} />
			{#if isOwned}
				<RemoveFromSharedLink bind:sharedLink allAssets={assets} />
			{/if}
		</AssetSelectControlBar>
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
					<ImmichLogo height="30" width="30" />
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

				{#if sharedLink?.allowDownload}
					<CircleIconButton
						title="Download"
						on:click={downloadAssets}
						logo={FolderDownloadOutline}
					/>
				{/if}
			</svelte:fragment>
		</ControlAppBar>
	{/if}
	<section class="flex flex-col my-[160px] px-6 sm:px-12 md:px-24 lg:px-40">
		<GalleryViewer {assets} {sharedLink} bind:selectedAssets viewFrom="shared-link-page" />
	</section>
</section>
