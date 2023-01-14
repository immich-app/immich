<script lang="ts">
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import { AssetResponseDto, SharedLinkResponseDto } from '@api';
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

	export let sharedLink: SharedLinkResponseDto;

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
		openFileUploadDialog(undefined, sharedLink?.key);
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
					<img src="/immich-logo.svg" alt="immich logo" height="30" width="30" />
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
