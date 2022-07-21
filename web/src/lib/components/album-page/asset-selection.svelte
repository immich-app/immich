<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { assetsGroupByDate, flattenAssetGroupByDate } from '$lib/stores/assets';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import CircleOutline from 'svelte-material-icons/CircleOutline.svelte';
	import moment from 'moment';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import { AssetResponseDto } from '@api';
	import AlbumAppBar from './album-app-bar.svelte';

	const dispatch = createEventDispatcher();

	export let assetsInAlbum: AssetResponseDto[];

	let selectedAsset: Set<string> = new Set();
	let selectedGroup: Set<number> = new Set();
	let existingGroup: Set<number> = new Set();
	let groupWithAssetsInAlbum: Record<number, Set<string>> = {};

	onMount(() => scanForExistingSelectedGroup());

	const selectAssetHandler = (assetId: string, groupIndex: number) => {
		const tempSelectedAsset = new Set(selectedAsset);

		if (selectedAsset.has(assetId)) {
			tempSelectedAsset.delete(assetId);

			const tempSelectedGroup = new Set(selectedGroup);
			tempSelectedGroup.delete(groupIndex);
			selectedGroup = tempSelectedGroup;
		} else {
			tempSelectedAsset.add(assetId);
		}

		selectedAsset = tempSelectedAsset;

		// Check if all assets are selected in a group to toggle the group selection's icon
		if (!selectedGroup.has(groupIndex)) {
			const assetsInGroup = $assetsGroupByDate[groupIndex];
			let selectedAssetsInGroupCount = 0;

			assetsInGroup.forEach((asset) => {
				if (selectedAsset.has(asset.id)) {
					selectedAssetsInGroupCount++;
				}
			});

			// Taking into account of assets in group that are already in album
			if (groupWithAssetsInAlbum[groupIndex]) {
				selectedAssetsInGroupCount += groupWithAssetsInAlbum[groupIndex].size;
			}

			// if all assets are selected in a group, add the group to selected group
			if (selectedAssetsInGroupCount == assetsInGroup.length) {
				selectedGroup = selectedGroup.add(groupIndex);
			}
		}
	};

	const selectAssetGroupHandler = (groupIndex: number) => {
		if (existingGroup.has(groupIndex)) return;

		let tempSelectedGroup = new Set(selectedGroup);
		let tempSelectedAsset = new Set(selectedAsset);

		if (selectedGroup.has(groupIndex)) {
			tempSelectedGroup.delete(groupIndex);
			tempSelectedAsset.forEach((assetId) => {
				if ($assetsGroupByDate[groupIndex].find((a) => a.id == assetId)) {
					tempSelectedAsset.delete(assetId);
				}
			});
		} else {
			tempSelectedGroup.add(groupIndex);
			tempSelectedAsset = new Set([
				...selectedAsset,
				...$assetsGroupByDate[groupIndex].map((a) => a.id)
			]);
		}

		// Remove existed assets in the date group
		if (groupWithAssetsInAlbum[groupIndex]) {
			tempSelectedAsset.forEach((assetId) => {
				if (groupWithAssetsInAlbum[groupIndex].has(assetId)) {
					tempSelectedAsset.delete(assetId);
				}
			});
		}

		selectedAsset = tempSelectedAsset;
		selectedGroup = tempSelectedGroup;
	};

	const addSelectedAssets = async () => {
		dispatch('create-album', {
			assets: Array.from(selectedAsset)
		});
	};

	/**
	 * This function is used to scan for existing selected group in the album
	 * and format it into the form of Record<any, Set<string>> to conditionally render and perform interaction
	 * relationship between the noneselected assets/groups
	 * with the existing assets/groups
	 */
	const scanForExistingSelectedGroup = () => {
		if (assetsInAlbum) {
			// Convert to each assetGroup to set of assetIds
			const distinctAssetGroup = $assetsGroupByDate.map((assetGroup) => {
				return new Set(assetGroup.map((asset) => asset.id));
			});

			// Find the group that contains all existed assets with the same set of assetIds
			for (const assetInAlbum of assetsInAlbum) {
				distinctAssetGroup.forEach((group, index) => {
					if (group.has(assetInAlbum.id)) {
						groupWithAssetsInAlbum[index] = new Set(groupWithAssetsInAlbum[index] || []).add(
							assetInAlbum.id
						);
					}
				});
			}

			Object.keys(groupWithAssetsInAlbum).forEach((key) => {
				if (distinctAssetGroup[parseInt(key)].size == groupWithAssetsInAlbum[parseInt(key)].size) {
					existingGroup = existingGroup.add(parseInt(key));
				}
			});
		}
	};
</script>

<section
	transition:fly={{ y: 1000, duration: 200, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full  bg-immich-bg z-[200]"
>
	<AlbumAppBar on:close-button-click={() => dispatch('go-back')}>
		<svelte:fragment slot="leading">
			{#if selectedAsset.size == 0}
				<p class="text-lg">Add to album</p>
			{:else}
				<p class="text-lg">{selectedAsset.size} selected</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="trailing">
			<button
				disabled={selectedAsset.size === 0}
				on:click={addSelectedAssets}
				class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed"
				><span class="px-2">Done</span></button
			>
		</svelte:fragment>
	</AlbumAppBar>

	<section id="image-grid" class="flex flex-wrap gap-14 mt-[160px] px-20">
		{#each $assetsGroupByDate as assetsInDateGroup, groupIndex}
			<!-- Asset Group By Date -->
			<div class="flex flex-col">
				<!-- Date group title -->
				<p class="font-medium text-sm text-immich-fg mb-2 flex place-items-center h-6">
					<span
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
					</span>

					{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
				</p>

				<!-- Image grid -->
				<div class="flex flex-wrap gap-[2px]">
					{#each assetsInDateGroup as asset}
						<ImmichThumbnail
							{asset}
							on:click={() => selectAssetHandler(asset.id, groupIndex)}
							{groupIndex}
							selected={selectedAsset.has(asset.id)}
							isExisted={assetsInAlbum.findIndex((a) => a.id == asset.id) != -1}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</section>
</section>
