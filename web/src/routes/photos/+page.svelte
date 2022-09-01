<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import { fly } from 'svelte/transition';
	import {
		assetsGroupByDate,
		flattenAssetGroupByDate,
		assets,
		assetStore
	} from '$lib/stores/assets';
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import moment from 'moment';
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import { openFileUploadDialog, UploadType } from '$lib/utils/file-uploader';
	import { api, AssetResponseDto } from '@api';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import CircleOutline from 'svelte-material-icons/CircleOutline.svelte';
	import CircleIconButton from '$lib/components/shared-components/circle-icon-button.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import type { PageData } from './$types';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import { onMount, onDestroy, afterUpdate, beforeUpdate } from 'svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
	import Scrollbar from '$lib/components/shared-components/scrollbar/scrollbar.svelte';
	import { AssetStoreState } from '$lib/models/asset-store-state';

	export let data: PageData;

	let selectedGroupThumbnail: number | null;
	let isMouseOverGroup: boolean;

	let multiSelectedAssets = new Set<AssetResponseDto>();
	$: isMultiSelectionMode = multiSelectedAssets.size > 0;

	let selectedGroup: Set<number> = new Set();
	let existingGroup: Set<number> = new Set();

	$: if (isMouseOverGroup == false) {
		selectedGroupThumbnail = null;
	}

	let isShowAssetViewer = false;
	let currentViewAssetIndex = 0;
	let selectedAsset: AssetResponseDto;
	let viewportWidth = 0;
	let viewportHeight = 0;
	let timelineScrollY = 0;
	let timelineElement: HTMLElement;
	let timelineHeight = 0;
	let assetStoreState: AssetStoreState[] = [];
	let DOMSegmentHeight: number[] = [];

	let unsubscribeAssetStore = assetStore.assets.subscribe((e) => {
		assetStoreState = e;
	});

	let subscribeTimelineHeight = assetStore.calculatedTimelineHeight.subscribe((e) => {
		timelineHeight = e;
	});

	onMount(async () => {
		openWebsocketConnection();

		timelineElement.addEventListener('scroll', () => {
			timelineScrollY = timelineElement.scrollTop;
		});

		getInitialLoadLayout();

		return () => {
			closeWebsocketConnection();
			unsubscribeAssetStore();
			subscribeTimelineHeight();
			timelineElement?.removeEventListener('scroll', () => {});
		};
	});

	const getInitialLoadLayout = async () => {
		await assetStore.calculateSegmentViewport(viewportWidth, data.assetCountByTimeGroup);

		// Get assets to fill the view port.
		let totalSegmentHeight = 0;
		const timeBuckets = [];

		for (const [index, assetSegment] of assetStoreState.entries()) {
			totalSegmentHeight += assetSegment.segmentHeight;
			timeBuckets.push(assetSegment.segmentDate);

			if (totalSegmentHeight >= viewportHeight || index === assetStoreState.length - 1) {
				break;
			}
		}

		await assetStore.getAssetsByTimeBuckets(timeBuckets);

		// Update actual DOM height of each segment.
		for (const [index, assetSegment] of assetStoreState.entries()) {
			if (timeBuckets.includes(assetSegment.segmentDate)) {
				const segmentDOMElement = document.getElementById(assetSegment.segmentDate);
				DOMSegmentHeight[index] = segmentDOMElement?.clientHeight || assetSegment.segmentHeight;
				assetStore.updateSegmentHeight(assetSegment.segmentDate, DOMSegmentHeight[index]);
			}
		}
	};

	const handleLoadSegmentAsset = async (event: CustomEvent) => {
		const segmentElement = event.detail as HTMLElement;

		if (segmentElement.firstChild) {
			const targetElement = segmentElement.childNodes[0] as HTMLElement;

			if (targetElement.id && targetElement.id != assetStoreState[0].segmentDate) {
				await assetStore.getAssetsByTimeBuckets([targetElement.id]);

				// Update actual DOM height of each segment.
				for (const [index, assetSegment] of assetStoreState.entries()) {
					if (assetSegment.segmentDate == targetElement.id) {
						const segmentDOMElement = document.getElementById(assetSegment.segmentDate);
						DOMSegmentHeight[index] = segmentDOMElement?.clientHeight || assetSegment.segmentHeight;

						assetStore.updateSegmentHeight(assetSegment.segmentDate, DOMSegmentHeight[index]);
					}
				}
			}
		}
	};

	const thumbnailMouseEventHandler = (event: CustomEvent) => {
		const { selectedGroupIndex }: { selectedGroupIndex: number } = event.detail;

		selectedGroupThumbnail = selectedGroupIndex;
	};

	const viewAssetHandler = (event: CustomEvent) => {
		const { asset }: { asset: AssetResponseDto } = event.detail;

		currentViewAssetIndex = $flattenAssetGroupByDate.findIndex((a) => a.id == asset.id);
		selectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
		isShowAssetViewer = true;
		pushState(selectedAsset.id);
	};

	const navigateAssetForward = () => {
		try {
			if (currentViewAssetIndex < $flattenAssetGroupByDate.length - 1) {
				currentViewAssetIndex++;
				selectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Info,
				message: 'You have reached the end'
			});
		}
	};

	const navigateAssetBackward = () => {
		try {
			if (currentViewAssetIndex > 0) {
				currentViewAssetIndex--;
				selectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
				pushState(selectedAsset.id);
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Info,
				message: 'You have reached the end'
			});
		}
	};

	const pushState = (assetId: string) => {
		// add a URL to the browser's history
		// changes the current URL in the address bar but doesn't perform any SvelteKit navigation
		history.pushState(null, '', `/photos/${assetId}`);
	};

	const closeViewer = () => {
		isShowAssetViewer = false;
		history.pushState(null, '', `/photos`);
	};

	const selectAssetHandler = (asset: AssetResponseDto, groupIndex: number) => {
		let temp = new Set(multiSelectedAssets);

		if (multiSelectedAssets.has(asset)) {
			temp.delete(asset);

			const tempSelectedGroup = new Set(selectedGroup);
			tempSelectedGroup.delete(groupIndex);
			selectedGroup = tempSelectedGroup;
		} else {
			temp.add(asset);
		}

		multiSelectedAssets = temp;

		// Check if all assets are selected in a group to toggle the group selection's icon
		// if (!selectedGroup.has(groupIndex)) {
		// 	const assetsInGroup = $assetsGroupByDate[groupIndex];
		// 	let selectedAssetsInGroupCount = 0;

		// 	assetsInGroup.forEach((asset) => {
		// 		if (multiSelectedAssets.has(asset)) {
		// 			selectedAssetsInGroupCount++;
		// 		}
		// 	});

		// 	// if all assets are selected in a group, add the group to selected group
		// 	if (selectedAssetsInGroupCount == assetsInGroup.length) {
		// 		selectedGroup = selectedGroup.add(groupIndex);
		// 	}
		// }

		console.log(multiSelectedAssets);
	};

	const clearMultiSelectAssetAssetHandler = () => {
		multiSelectedAssets = new Set();
		selectedGroup = new Set();
		existingGroup = new Set();
	};

	const selectAssetGroupHandler = (groupIndex: number) => {
		if (existingGroup.has(groupIndex)) return;

		let tempSelectedGroup = new Set(selectedGroup);
		let tempSelectedAsset = new Set(multiSelectedAssets);

		if (selectedGroup.has(groupIndex)) {
			tempSelectedGroup.delete(groupIndex);
			tempSelectedAsset.forEach((asset) => {
				if ($assetsGroupByDate[groupIndex].find((a) => a.id == asset.id)) {
					tempSelectedAsset.delete(asset);
				}
			});
		} else {
			tempSelectedGroup.add(groupIndex);
			tempSelectedAsset = new Set([...multiSelectedAssets, ...$assetsGroupByDate[groupIndex]]);
		}

		multiSelectedAssets = tempSelectedAsset;
		selectedGroup = tempSelectedGroup;
	};

	const deleteSelectedAssetHandler = async () => {
		try {
			if (
				window.confirm(
					`Caution! Are you sure you want to delete ${multiSelectedAssets.size} assets? This step also deletes assets in the album(s) to which they belong. You can not undo this action!`
				)
			) {
				const { data: deletedAssets } = await api.assetApi.deleteAsset({
					ids: Array.from(multiSelectedAssets).map((a) => a.id)
				});

				for (const asset of deletedAssets) {
					if (asset.status == 'SUCCESS') {
						$assets = $assets.filter((a) => a.id !== asset.id);
					}
				}

				clearMultiSelectAssetAssetHandler();
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error deleting assets, check console for more details'
			});
			console.error('Error deleteSelectedAssetHandler', e);
		}
	};

	let observerElement: HTMLElement | null = null;
</script>

<svelte:head>
	<title>Photos - Immich</title>
</svelte:head>

<section>
	{#if isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={clearMultiSelectAssetAssetHandler}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary">Selected {multiSelectedAssets.size}</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Delete"
					logo={DeleteOutline}
					on:click={deleteSelectedAssetHandler}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{/if}

	{#if !isMultiSelectionMode}
		<NavigationBar
			user={data.user}
			on:uploadClicked={() => openFileUploadDialog(UploadType.GENERAL)}
		/>
	{/if}
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />

	<section
		id="assets-content"
		class="overflow-y-auto relative"
		bind:this={timelineElement}
		bind:clientWidth={viewportWidth}
		bind:clientHeight={viewportHeight}
	>
		<Scrollbar
			{viewportWidth}
			scrollbarHeight={viewportHeight}
			segmentData={data.assetCountByTimeGroup}
			scrollTop={timelineScrollY}
		/>

		<section
			id="immich-timeline"
			class="pt-8 pl-4 mb-12 bg-immich-bg"
			style:height={timelineHeight + 'px'}
		>
			{#each assetStoreState as segment, i (i)}
				<div style:height={segment.segmentHeight + 'px'}>
					<IntersectionObserver once={false} bottom={500} on:intersected={handleLoadSegmentAsset}>
						<div id={segment.segmentDate} class="flex flex-wrap gap-14 pb-14">
							{#each segment.assetsGroupByDate as assetsInDateGroup, groupIndex}
								<!-- Asset Group By Date -->
								<div
									class="flex flex-col"
									on:mouseenter={() => (isMouseOverGroup = true)}
									on:mouseleave={() => (isMouseOverGroup = false)}
								>
									<!-- Date group title -->
									<p class="font-medium text-sm text-immich-fg mb-2 flex place-items-center h-6">
										{#if (selectedGroupThumbnail === groupIndex && isMouseOverGroup) || selectedGroup.has(groupIndex)}
											<div
												in:fly={{ x: -24, duration: 200, opacity: 0.5 }}
												out:fly={{ x: -24, duration: 200 }}
												class="inline-block px-2 hover:cursor-pointer"
												on:click={() => selectAssetGroupHandler(groupIndex)}
											>
												{#if selectedGroup.has(groupIndex)}
													<CheckCircle size="24" color="#4250af" />
												{:else if existingGroup.has(groupIndex)}
													<CheckCircle size="24" color="#757575" />
												{:else}
													<CircleOutline size="24" color="#757575" />
												{/if}
											</div>
										{/if}

										{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
									</p>

									<!-- Image grid -->
									<div class="flex flex-wrap gap-[2px]">
										{#each assetsInDateGroup as asset (asset.id)}
											<ImmichThumbnail
												{asset}
												on:mouseEvent={thumbnailMouseEventHandler}
												on:click={(event) =>
													isMultiSelectionMode
														? selectAssetHandler(asset, groupIndex)
														: viewAssetHandler(event)}
												on:select={() => selectAssetHandler(asset, groupIndex)}
												selected={multiSelectedAssets.has(asset)}
												{groupIndex}
											/>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</IntersectionObserver>
				</div>
			{/each}
		</section>
	</section>
</section>

<!-- Overlay Asset Viewer -->
{#if isShowAssetViewer}
	<AssetViewer
		asset={selectedAsset}
		on:navigate-backward={navigateAssetBackward}
		on:navigate-forward={navigateAssetForward}
		on:close={closeViewer}
	/>
{/if}

<style>
	#immich-timeline {
		contain: layout;
	}
</style>
