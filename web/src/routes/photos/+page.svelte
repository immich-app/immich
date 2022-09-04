<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';

	import type { PageData } from './$types';

	import { openFileUploadDialog, UploadType } from '$lib/utils/file-uploader';
	import { onMount } from 'svelte';
	import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import CircleIconButton from '$lib/components/shared-components/circle-icon-button.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';

	export let data: PageData;

	onMount(async () => {
		openWebsocketConnection();

		return () => {
			closeWebsocketConnection();
		};
	});

	const deleteSelectedAssetHandler = () => {};
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
				<p class="font-medium text-immich-primary">Selected {$selectedAssets.size}</p>
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

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />
	<AssetGrid />
</section>
