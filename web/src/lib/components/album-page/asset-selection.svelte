<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { fly } from 'svelte/transition';
	import { assetsGroupByDate, flattenAssetGroupByDate } from '$lib/stores/assets';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import CircleOutline from 'svelte-material-icons/CircleOutline.svelte';
	import moment from 'moment';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import { AssetResponseDto } from '@api';

	const dispatch = createEventDispatcher();

	export let existedAssets: AssetResponseDto[];

	let selectedGroupThumbnail: number | null;
	let isMouseOverGroup: boolean;
	let border = '';
	let selectedAsset: Set<string> = new Set();
	let selectedGroup: Set<number> = new Set();

	$: if (isMouseOverGroup == false) {
		selectedGroupThumbnail = null;
	}

	const thumbnailMouseEventHandler = (event: CustomEvent) => {
		const { selectedGroupIndex }: { selectedGroupIndex: number } = event.detail;

		selectedGroupThumbnail = selectedGroupIndex;
	};

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

		// Check if all assets are selected in a group
		if (!selectedGroup.has(groupIndex)) {
			const assetsInGroup = $assetsGroupByDate[groupIndex];
			let selectedAssetsInGroupCount = 0;

			assetsInGroup.forEach((asset) => {
				if (selectedAsset.has(asset.id)) {
					selectedAssetsInGroupCount++;
				}
			});

			if (selectedAssetsInGroupCount == assetsInGroup.length) {
				selectedGroup = selectedGroup.add(groupIndex);
			}
		}
	};

	const selectAssetGroupHandler = (groupIndex: number) => {
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

		selectedAsset = tempSelectedAsset;
		selectedGroup = tempSelectedGroup;
	};

	onMount(() => {
		window.onscroll = (event: Event) => {
			if (window.pageYOffset > 80) {
				border = 'border border-gray-200 bg-gray-50';
			} else {
				border = '';
			}
		};
	});

	const addSelectedAssets = async () => {
		dispatch('create-album', {
			assets: Array.from(selectedAsset)
		});
	};
</script>

<section
	transition:fly={{ y: 1000, duration: 200, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full  bg-immich-bg z-[200]"
>
	<div class="fixed top-0 w-full bg-transparent z-[100] ">
		<div
			class={`flex justify-between ${border} rounded-lg p-2 mx-2 mt-2  transition-all place-items-center`}
		>
			<!-- Left button group -->
			<div class="flex place-items-center gap-6">
				<button
					on:click={() => dispatch('go-back')}
					id="immich-circle-icon-button"
					class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
				>
					<Close size="24" />
				</button>

				{#if selectedAsset.size == 0}
					<p class="text-lg">Add to album</p>
				{:else}
					<p class="text-lg">{selectedAsset.size} selected</p>
				{/if}
			</div>

			<!-- Right Button Group -->
			<div class="flex place-items-center gap-6 mr-4">
				<button
					disabled={selectedAsset.size === 0}
					on:click={addSelectedAssets}
					class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed"
					><span class="px-2">Done</span></button
				>
			</div>
		</div>
	</div>

	<section id="image-grid" class="flex flex-wrap gap-14 mt-[160px] px-20">
		{#each $assetsGroupByDate as assetsInDateGroup, groupIndex}
			<!-- Asset Group By Date -->
			<div
				class="flex flex-col"
				on:mouseenter={() => (isMouseOverGroup = true)}
				on:mouseleave={() => (isMouseOverGroup = false)}
			>
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
							on:mouseEvent={thumbnailMouseEventHandler}
							on:click={() => selectAssetHandler(asset.id, groupIndex)}
							{groupIndex}
							selected={selectedAsset.has(asset.id)}
							isExisted={existedAssets.findIndex((a) => a.id == asset.id) != -1}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</section>
</section>
