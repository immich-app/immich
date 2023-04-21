<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
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
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import type { PageData } from './$types';

	let favorites: AssetResponseDto[] = [];
	let isShowCreateSharedLinkModal = false;
	let selectedAssets: Set<AssetResponseDto> = new Set();

	export let data: PageData;

	$: isMultiSelectionMode = selectedAssets.size > 0;

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(true, undefined);
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

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode}>
	<section>
		<!-- Empty Message -->
		{#if favorites.length === 0}
			<EmptyPlaceholder
				text="Add favorites to quickly find your best pictures and videos"
				alt="Empty favorites"
			/>
		{/if}

		<GalleryViewer assets={favorites} bind:selectedAssets viewFrom="favorites-page" />
	</section>
</UserPageLayout>
