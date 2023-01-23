<script lang="ts">
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import CircleIconButton from '$lib/components/shared-components/circle-icon-button.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import Portal from '$lib/components/shared-components/portal/portal.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		isViewingAssetStoreState,
		selectedAssets,
		viewingAssetStoreState
	} from '$lib/stores/asset-interaction.store';
	import { api, AssetResponseDto, SharedLinkType } from '@api';
	import { onMount } from 'svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import StarMinusOutline from 'svelte-material-icons/StarMinusOutline.svelte';
	import type { PageData } from './$types';
	import { useFavorites } from './favorites.bloc';

	export let data: PageData;
	let isShowCreateSharedLinkModal = false;

	const {
		favorites,
		loadFavorites,
	} = useFavorites({ favorites: [] });

	onMount(loadFavorites);

	const handleCreateSharedLink = async () => {
		isShowCreateSharedLinkModal = true;
	};

	const handleCloseSharedLinkModal = () => {
		assetInteractionStore.clearMultiselect();
		isShowCreateSharedLinkModal = false;
	};

	const handleRemoveFavorite = () => {
		const assetIds = Array.from($selectedAssets).map((asset) => asset.id);
		for (const assetId of assetIds) {
			api.assetApi.updateAsset(assetId, {
				isFavorite: false
			});
		}

		assetInteractionStore.clearMultiselect();
	};

	const navigateToPreviousAsset = () => {
		assetInteractionStore.navigateAsset('previous');
	};

	const navigateToNextAsset = () => {
		assetInteractionStore.navigateAsset('next');
	};

	const assetClickHandler = (asset: AssetResponseDto) => {
		if ($isMultiSelectStoreState) {
			assetSelectHandler(asset);
		} else {
			assetInteractionStore.setViewingAsset(asset);
		}
	};

	const assetSelectHandler = (asset: AssetResponseDto) => {
		if ($selectedAssets.has(asset)) {
			assetInteractionStore.removeAssetFromMultiselectGroup(asset);
		} else {
			assetInteractionStore.addAssetToMultiselectGroup(asset);
		}
	};

</script>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg  dark:bg-immich-dark-bg"
>
	<SideBar />

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
					title="Share"
					logo={ShareVariantOutline}
					on:click={handleCreateSharedLink}
				/>
				<CircleIconButton
					title="Remove Favorite"
					logo={StarMinusOutline}
					on:click={handleRemoveFavorite}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{/if}

	{#if isShowCreateSharedLinkModal}
		<CreateSharedLinkModal
			sharedAssets={Array.from($selectedAssets)}
			shareType={SharedLinkType.Individual}
			on:close={handleCloseSharedLinkModal}
		/>
	{/if}

	<!-- Main Section -->

	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="favorite-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<div class="px-4 flex justify-between place-items-center dark:text-immich-dark-fg">
				<div>
					<p class="font-medium">Favorites</p>
				</div>
			</div>

			<div class="my-4">
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<!-- Image grid -->
			<div class="flex flex-wrap gap-[2px]">
				{#each $favorites as asset (asset.id)}
					<ImmichThumbnail
						{asset}
						on:click={() => assetClickHandler(asset)}
						on:select={() => assetSelectHandler(asset)}
						selected={$selectedAssets.has(asset)}
					/>
				{/each}
			</div>

			<!-- Empty Message -->
			{#if $favorites.length === 0}
				<div
					class="border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 hover:cursor-pointer p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center"
				>
					<img src="/empty-1.svg" alt="Empty shared album" width="500" draggable="false" />

					<p class="text-center text-immich-text-gray-500 dark:text-immich-dark-fg">
						Add favorites to quickly find your best pictures and videos
					</p>
				</div>
			{/if}
		</section>
	</section>

</section>

<Portal target="body">
	{#if $isViewingAssetStoreState}
		<AssetViewer
			asset={$viewingAssetStoreState}
			on:navigate-previous={navigateToPreviousAsset}
			on:navigate-next={navigateToNextAsset}
			on:close={() => {
				assetInteractionStore.setIsViewingAsset(false);
			}}
		/>
	{/if}
</Portal>
