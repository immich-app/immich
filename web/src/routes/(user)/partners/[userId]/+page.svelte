<script lang="ts">
	import type { PageData } from './$types';
	import { AppRoute } from '$lib/constants';
	import { locale } from '$lib/stores/preferences.store';
	import { goto } from '$app/navigation';
	import { bulkDownload } from '$lib/utils/asset-utils';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';

	export let data: PageData;

	const handleDownloadFiles = async () => {
		await bulkDownload('immich', Array.from($selectedAssets), () => {
			assetInteractionStore.clearMultiselect();
		});
	};
</script>

<main class="grid h-screen pt-[4.25rem] bg-immich-bg dark:bg-immich-dark-bg">
	{#if $isMultiSelectStoreState}
		<ControlAppBar
			showBackButton
			backIcon={Close}
			on:close-button-click={() => assetInteractionStore.clearMultiselect()}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {$selectedAssets.size.toLocaleString($locale)}
				</p>
			</svelte:fragment>

			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Download"
					logo={CloudDownloadOutline}
					on:click={handleDownloadFiles}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{:else}
		<ControlAppBar
			showBackButton
			backIcon={ArrowLeft}
			on:close-button-click={() => goto(AppRoute.SHARING)}
		>
			<svelte:fragment slot="leading">
				<p class="text-immich-fg dark:text-immich-dark-fg">
					{data.partner.firstName}
					{data.partner.lastName}'s photos
				</p>
			</svelte:fragment>
		</ControlAppBar>
	{/if}
	<AssetGrid user={data.partner} />
</main>
