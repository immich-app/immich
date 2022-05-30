<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import { getAssetsInfo } from '$lib/stores/assets';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		return {
			status: 200,
			props: {
				user: session.user,
			},
		};
	};
</script>

<script lang="ts">
	import type { ImmichUser } from '$lib/models/immich-user';

	import NavigationBar from '../../lib/components/shared/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared/side-bar-button.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { session } from '$app/stores';
	import { assetsGroupByDate, flattenAssetGroupByDate } from '$lib/stores/assets';
	import ImmichThumbnail from '../../lib/components/photos/immich-thumbnail.svelte';
	import moment from 'moment';
	import PhotoViewer from '../../lib/components/photos/photo_viewer.svelte';
	import type { ImmichAsset } from '../../lib/models/immich-asset';
	import { AssetType } from '../../lib/models/immich-asset';
	import LoadingSpinner from '../../lib/components/shared/loading-spinner.svelte';

	export let user: ImmichUser;
	let selectedAction: AppSideBarSelection;

	let selectedGroupThumbnail: number | null;
	let isMouseOverGroup: boolean;
	$: if (isMouseOverGroup == false) {
		selectedGroupThumbnail = null;
	}

	let isShowAsset = false;
	let viewDeviceId: string = '';
	let viewAssetId: string = '';
	let currentViewAssetIndex = 0;
	let currentSelectedAsset: ImmichAsset;

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AppSideBarSelection;
	};

	onMount(async () => {
		selectedAction = AppSideBarSelection.PHOTOS;

		if ($session.user) {
			await getAssetsInfo($session.user.accessToken);
		}
	});

	const thumbnailMouseEventHandler = (event: CustomEvent) => {
		const { selectedGroupIndex }: { selectedGroupIndex: number } = event.detail;

		selectedGroupThumbnail = selectedGroupIndex;
	};

	const viewAssetHandler = (event: CustomEvent) => {
		const { assetId, deviceId }: { assetId: string; deviceId: string } = event.detail;

		viewDeviceId = deviceId;
		viewAssetId = assetId;

		currentViewAssetIndex = $flattenAssetGroupByDate.findIndex((a) => a.id == assetId);
		currentSelectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
		isShowAsset = true;
	};

	const navigateAssetForward = () => {
		const nextAsset = $flattenAssetGroupByDate[currentViewAssetIndex + 1];
		viewDeviceId = nextAsset.deviceId;
		viewAssetId = nextAsset.id;

		currentViewAssetIndex = currentViewAssetIndex + 1;
		currentSelectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
	};

	const navigateAssetBackward = () => {
		const lastAsset = $flattenAssetGroupByDate[currentViewAssetIndex - 1];
		viewDeviceId = lastAsset.deviceId;
		viewAssetId = lastAsset.id;

		currentViewAssetIndex = currentViewAssetIndex - 1;
		currentSelectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
	};
</script>

<svelte:head>
	<title>Immich - Photos</title>
</svelte:head>

<section>
	<NavigationBar {user} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen">
	<!-- Sidebar -->
	<section id="admin-sidebar" class="flex flex-col gap-4 pt-8 pr-6">
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			actionType={AppSideBarSelection.PHOTOS}
			isSelected={selectedAction === AppSideBarSelection.PHOTOS}
			on:selected={onButtonClicked}
		/>
	</section>

	<!-- Main Section -->
	<section class="overflow-y-auto relative">
		<section id="assets-content" class="relative pt-8 pl-4">
			<section id="image-grid" class="flex flex-wrap gap-14">
				{#each $assetsGroupByDate as assetsInDateGroup, groupIndex}
					<!-- Asset Group By Date -->
					<div
						class="flex flex-col"
						on:mouseenter={() => (isMouseOverGroup = true)}
						on:mouseleave={() => (isMouseOverGroup = false)}
					>
						<!-- Date group title -->
						<p class="font-medium text-sm text-immich-primary mb-2 flex place-items-center h-6">
							{#if selectedGroupThumbnail === groupIndex && isMouseOverGroup}
								<div
									in:fly={{ x: -24, duration: 200, opacity: 0.5 }}
									out:fly={{ x: -24, duration: 200 }}
									class="inline-block px-2 hover:cursor-pointer"
								>
									<CheckCircle size="24" color="#757575" />
								</div>
							{/if}

							{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
						</p>

						<!-- Image grid -->
						<div class="flex flex-wrap gap-2">
							{#each assetsInDateGroup as asset}
								<ImmichThumbnail
									{asset}
									on:mouseEvent={thumbnailMouseEventHandler}
									on:viewAsset={viewAssetHandler}
									{groupIndex}
								/>
							{/each}
						</div>
					</div>
				{/each}
			</section>
		</section>
	</section>
</section>

<!-- Overlay Asset Viewer -->
{#if isShowAsset}
	<section
		class="absolute w-screen h-screen top-0 overflow-y-hidden bg-black z-[9999] flex justify-between place-items-center"
	>
		<button
			class="rounded-full p-4 hover:bg-gray-500 hover:text-gray-700  text-gray-500 mx-4"
			on:click={navigateAssetBackward}
		>
			<ChevronLeft size="48" />
		</button>

		{#key currentViewAssetIndex}
			{#if currentSelectedAsset.type == AssetType.IMAGE}
				<PhotoViewer assetId={viewAssetId} deviceId={viewDeviceId} on:close={() => (isShowAsset = false)} />
			{:else}
				<div
					class="w-full h-full bg-immich-primary/10 flex flex-col place-items-center place-content-center "
					on:click={() => (isShowAsset = false)}
				>
					<h1 class="animate-pulse font-bold text-4xl">Video viewer is under construction</h1>
				</div>
			{/if}
		{/key}

		<button
			class="rounded-full p-4 hover:bg-gray-500 hover:text-gray-700 bg-black text-gray-500 mx-4"
			on:click={navigateAssetForward}
		>
			<ChevronRight size="48" />
		</button>
	</section>
{/if}
