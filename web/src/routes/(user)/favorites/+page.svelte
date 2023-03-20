<script lang="ts">
	import CircleIconButton from '$lib/components/shared-components/circle-icon-button.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { api, AssetResponseDto, SharedLinkType } from '@api';
	import { onMount } from 'svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
	import StarMinusOutline from 'svelte-material-icons/StarMinusOutline.svelte';
	import Error from '../../+error.svelte';
	import empty1Url from '$lib/assets/empty-1.svg';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import type { PageData } from './$types';

	let favorites: AssetResponseDto[] = [];
	let isShowCreateSharedLinkModal = false;
	let selectedAssets: Set<AssetResponseDto> = new Set();

	export let data: PageData;

	$: isMultiSelectionMode = selectedAssets.size > 0;

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(true);
			favorites = assets;
		} catch {
			handleError(Error, 'Unable to load favorites');
		}
	});

	const clearMultiSelectAssetAssetHandler = () => {
		selectedAssets = new Set();
	};

	const handleCreateSharedLink = async () => {
		isShowCreateSharedLinkModal = true;
	};

	const handleCloseSharedLinkModal = () => {
		clearMultiSelectAssetAssetHandler();
		isShowCreateSharedLinkModal = false;
	};

	const handleRemoveFavorite = async () => {
		for (const asset of selectedAssets) {
			try {
				await api.assetApi.updateAsset(asset.id, {
					isFavorite: false
				});
				favorites = favorites.filter((a) => a.id != asset.id);
			} catch {
				handleError(Error, 'Error updating asset favorite state');
			}
		}

		clearMultiSelectAssetAssetHandler();
	};
</script>

<!-- Multiselection mode app bar -->
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

<!-- Create shared link modal -->
{#if isShowCreateSharedLinkModal}
	<CreateSharedLinkModal
		sharedAssets={Array.from(selectedAssets)}
		shareType={SharedLinkType.Individual}
		on:close={handleCloseSharedLinkModal}
	/>
{/if}

<UserPageLayout user={data.user} title={data.meta.title} hideNavbar={isMultiSelectionMode}>
	<section>
		<!-- Empty Message -->
		{#if favorites.length === 0}
			<div
				class="border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 hover:cursor-pointer p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center"
			>
				<img src={empty1Url} alt="Empty shared album" width="500" draggable="false" />

				<p class="text-center text-immich-text-gray-500 dark:text-immich-dark-fg">
					Add favorites to quickly find your best pictures and videos
				</p>
			</div>
		{/if}

		<GalleryViewer assets={favorites} bind:selectedAssets />
	</section>
</UserPageLayout>
