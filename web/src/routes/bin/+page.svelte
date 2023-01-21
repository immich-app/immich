<script lang="ts">
	import type { PageData } from './$types';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import DeleteEmpty from 'svelte-material-icons/DeleteEmpty.svelte';
	import { api, AssetResponseDto } from '@api';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import Restore from 'svelte-material-icons/Restore.svelte';
	import DeleteForever from 'svelte-material-icons/DeleteForever.svelte';
	import TextLogoButton from '$lib/components/shared-components/text-logo-button.svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';

	export let data: PageData;

	let multiSelectAsset: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = multiSelectAsset.size > 0;

	const getReycleBinConfig = async () => {
		const { data } = await api.recycleBinApi.getRecycleBinConfig();
		return data;
	};

	const clearMultiSelectAssetAssetHandler = () => {
		multiSelectAsset = new Set();
	};

	const removeAsset = async (assetId: string) => {
		for (let index = 0; index < data.assets.length; index++) {
			if (data.assets[index].id == assetId) {
				data.assets.splice(index, 1);
			}
		}
	};

	const handleRestoreAssets = async () => {
		if (window.confirm('Do you want to restore selected assets?')) {
			try {
				const { data: restoreData } = await api.recycleBinApi.restoreDeletedAssets({
					assetIds: Array.from(multiSelectAsset).map((a) => a.id)
				});

				data.assets = restoreData;
				console.log(data);
				multiSelectAsset = new Set();
			} catch (e) {
				notificationController.show({
					type: NotificationType.Error,
					message: 'Error restoring assets from bin, check console for more details'
				});
			}
		}
	};

	const handlePermanentlyDeleteAssets = async () => {
		if (
			window.confirm(
				'Do you want to permanently delete selected assets? This action cannot be undone'
			)
		) {
			try {
				const { data: deletedAssets } = await api.recycleBinApi.deleteRecyleBinAssets({
					ids: Array.from(multiSelectAsset).map((a) => a.id)
				});

				for (const asset of deletedAssets) {
					if (asset.status == 'SUCCESS') {
						await removeAsset(asset.id);
					} else {
						notificationController.show({
							type: NotificationType.Error,
							message: 'Failed to delete asset'
						});
					}
				}
				multiSelectAsset = new Set();
			} catch (e) {
				notificationController.show({
					type: NotificationType.Error,
					message: 'Error permanently deleting assets from bin, check console for more details'
				});
			}
		}
	};

	const handlePermanentlyDeleteAllAssets = async () => {
		if (
			window.confirm('Do you want to permanently delete all assets? This action cannot be undone')
		) {
			try {
				const { data: deletedAssets } = await api.recycleBinApi.emptyBin();

				for (const asset of deletedAssets) {
					if (asset.status == 'SUCCESS') {
						await removeAsset(asset.id);
					} else {
						notificationController.show({
							type: NotificationType.Error,
							message: 'Failed to delete asset'
						});
					}
				}
				multiSelectAsset = new Set();
			} catch (e) {
				notificationController.show({
					type: NotificationType.Error,
					message: 'Error permanently deleting assets from bin, check console for more details'
				});
			}
		}
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
					Selected {multiSelectAsset.size}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<TextLogoButton
					title="Permanently Delete"
					logo={DeleteForever}
					on:click={handlePermanentlyDeleteAssets}
				/>
				<TextLogoButton title="Restore" logo={Restore} on:click={handleRestoreAssets} />
			</svelte:fragment>
		</ControlAppBar>
	{:else}
		<NavigationBar user={data.user} shouldShowUploadButton={false} />
	{/if}
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg  dark:bg-immich-dark-bg"
>
	<SideBar />

	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="recycling-bin-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<div class="px-4 flex justify-between place-items-center dark:text-immich-dark-fg">
				<div>
					<p class="font-medium">Bin</p>
				</div>

				<div>
					<button
						class="immich-text-button text-sm dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
						on:click={handlePermanentlyDeleteAllAssets}
					>
						<span>
							<DeleteEmpty size="18" />
						</span>
						<p>Empty Bin</p>
					</button>
				</div>
			</div>

			<div class="my-4">
				<hr class="dark:border-immich-dark-gray" />
			</div>
		</section>
		{#await getReycleBinConfig()}
			<LoadingSpinner />
		{:then configs}
			<section class="relative pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
				<div>
					{#if configs.enabled}
						<p class="font-medium">
							Items in the bin will be permanently deleted after {configs.days} days.
						</p>
					{:else}
						<p class="font-medium">Recycling Bin has not been setup. Contact admin</p>
					{/if}
				</div>
			</section>

			<section>
				<GalleryViewer
					assets={data.assets}
					key={''}
					useDefaultSize={true}
					bind:selectedAssets={multiSelectAsset}
				/>
			</section>
		{/await}
	</section>
</section>
