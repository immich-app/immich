<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { fly } from 'svelte/transition';
	import { assetsGroupByDate, flattenAssetGroupByDate } from '$lib/stores/assets';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import moment from 'moment';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';

	const dispatch = createEventDispatcher();

	let selectedGroupThumbnail: number | null;
	let isMouseOverGroup: boolean;
	let border = '';

	$: if (isMouseOverGroup == false) {
		selectedGroupThumbnail = null;
	}

	const thumbnailMouseEventHandler = (event: CustomEvent) => {
		const { selectedGroupIndex }: { selectedGroupIndex: number } = event.detail;

		selectedGroupThumbnail = selectedGroupIndex;
	};

	const viewAssetHandler = (event: CustomEvent) => {
		const { assetId, deviceId }: { assetId: string; deviceId: string } = event.detail;
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
				<p class="text-lg">Add to album</p>
			</div>

			<!-- Right Button Group -->
			<div class="flex place-items-center gap-6 mr-4">
				<button
					class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm"
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
				<div class="flex flex-wrap gap-[2px]">
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
