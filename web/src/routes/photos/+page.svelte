<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';

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
	import { api } from '@api';
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
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg dark:bg-immich-dark-bg"
>
	<SideBar />
	<AssetGrid />
</section>
