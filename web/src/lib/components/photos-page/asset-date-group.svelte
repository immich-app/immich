<script lang="ts">
	import { assetStore } from '$lib/stores/assets.store';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import CircleOutline from 'svelte-material-icons/CircleOutline.svelte';
	import { fly } from 'svelte/transition';
	import { AssetResponseDto } from '@api';
	import lodash from 'lodash-es';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import {
		assetInteractionStore,
		assetsInAlbumStoreState,
		isMultiSelectStoreState,
		selectedAssets,
		selectedGroup
	} from '$lib/stores/asset-interaction.store';
	import { locale } from '$lib/stores/preferences.store';

	export let assets: AssetResponseDto[];
	export let bucketDate: string;
	export let bucketHeight: number;
	export let isAlbumSelectionMode = false;

	const groupDateFormat: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	};

	let isMouseOverGroup = false;
	let actualBucketHeight: number;
	let hoveredDateGroup = '';
	$: assetsGroupByDate = lodash
		.chain(assets)
		.groupBy((a) => new Date(a.fileCreatedAt).toLocaleDateString($locale, groupDateFormat))
		.sortBy((group) => assets.indexOf(group[0]))
		.value();

	$: {
		if (actualBucketHeight && actualBucketHeight != 0 && actualBucketHeight != bucketHeight) {
			assetStore.updateBucketHeight(bucketDate, actualBucketHeight);
		}
	}

	const assetClickHandler = (
		asset: AssetResponseDto,
		assetsInDateGroup: AssetResponseDto[],
		dateGroupTitle: string
	) => {
		if (isAlbumSelectionMode) {
			assetSelectHandler(asset, assetsInDateGroup, dateGroupTitle);
			return;
		}

		if ($isMultiSelectStoreState) {
			assetSelectHandler(asset, assetsInDateGroup, dateGroupTitle);
		} else {
			assetInteractionStore.setViewingAsset(asset);
		}
	};

	const selectAssetGroupHandler = (
		selectAssetGroupHandler: AssetResponseDto[],
		dateGroupTitle: string
	) => {
		if ($selectedGroup.has(dateGroupTitle)) {
			assetInteractionStore.removeGroupFromMultiselectGroup(dateGroupTitle);
			selectAssetGroupHandler.forEach((asset) => {
				assetInteractionStore.removeAssetFromMultiselectGroup(asset);
			});
		} else {
			assetInteractionStore.addGroupToMultiselectGroup(dateGroupTitle);
			selectAssetGroupHandler.forEach((asset) => {
				assetInteractionStore.addAssetToMultiselectGroup(asset);
			});
		}
	};

	const assetSelectHandler = (
		asset: AssetResponseDto,
		assetsInDateGroup: AssetResponseDto[],
		dateGroupTitle: string
	) => {
		if ($selectedAssets.has(asset)) {
			assetInteractionStore.removeAssetFromMultiselectGroup(asset);
		} else {
			assetInteractionStore.addAssetToMultiselectGroup(asset);
		}

		// Check if all assets are selected in a group to toggle the group selection's icon
		let selectedAssetsInGroupCount = 0;
		assetsInDateGroup.forEach((asset) => {
			if ($selectedAssets.has(asset)) {
				selectedAssetsInGroupCount++;
			}
		});

		// if all assets are selected in a group, add the group to selected group
		if (selectedAssetsInGroupCount == assetsInDateGroup.length) {
			assetInteractionStore.addGroupToMultiselectGroup(dateGroupTitle);
		} else {
			assetInteractionStore.removeGroupFromMultiselectGroup(dateGroupTitle);
		}
	};

	const assetMouseEventHandler = (dateGroupTitle: string) => {
		// Show multi select icon on hover on date group
		hoveredDateGroup = dateGroupTitle;
	};
</script>

<section
	id="asset-group-by-date"
	class="flex flex-wrap gap-12 mt-5"
	bind:clientHeight={actualBucketHeight}
>
	{#each assetsGroupByDate as assetsInDateGroup, groupIndex (assetsInDateGroup[0].id)}
		{@const dateGroupTitle = new Date(assetsInDateGroup[0].fileCreatedAt).toLocaleDateString(
			$locale,
			groupDateFormat
		)}
		<!-- Asset Group By Date -->

		<div
			class="flex flex-col"
			on:mouseenter={() => {
				isMouseOverGroup = true;
				assetMouseEventHandler(dateGroupTitle);
			}}
			on:mouseleave={() => (isMouseOverGroup = false)}
		>
			<!-- Date group title -->
			<p
				class="font-medium text-sm text-immich-fg dark:text-immich-dark-fg mb-2 flex place-items-center h-6"
			>
				{#if (hoveredDateGroup == dateGroupTitle && isMouseOverGroup) || $selectedGroup.has(dateGroupTitle)}
					<div
						transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
						class="inline-block px-2 hover:cursor-pointer"
						on:click={() => selectAssetGroupHandler(assetsInDateGroup, dateGroupTitle)}
						on:keydown={() => selectAssetGroupHandler(assetsInDateGroup, dateGroupTitle)}
					>
						{#if $selectedGroup.has(dateGroupTitle)}
							<CheckCircle size="24" color="#4250af" />
						{:else}
							<CircleOutline size="24" color="#757575" />
						{/if}
					</div>
				{/if}

				<span>
					{dateGroupTitle}
				</span>
			</p>

			<!-- Image grid -->
			<div class="flex flex-wrap gap-[2px]">
				{#each assetsInDateGroup as asset (asset.id)}
					<ImmichThumbnail
						{asset}
						{groupIndex}
						on:click={() => assetClickHandler(asset, assetsInDateGroup, dateGroupTitle)}
						on:select={() => assetSelectHandler(asset, assetsInDateGroup, dateGroupTitle)}
						on:mouse-event={() => assetMouseEventHandler(dateGroupTitle)}
						selected={$selectedAssets.has(asset)}
						disabled={$assetsInAlbumStoreState.findIndex((a) => a.id == asset.id) != -1}
					/>
				{/each}
			</div>
		</div>
	{/each}
</section>

<style>
	#asset-group-by-date {
		contain: layout;
	}
</style>
