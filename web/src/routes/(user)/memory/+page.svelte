<script lang="ts">
	import { memoryStore } from '$lib/stores/memory.store';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { OnThisDay, api } from '@api';
	import { goto } from '$app/navigation';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import { AppRoute } from '$lib/constants';
	import { page } from '$app/stores';

	let currentIndex = 0;

	const thisYear = DateTime.local().year;
	let onThisDay: OnThisDay;

	onMount(async () => {
		if (!$memoryStore) {
			const timezone = DateTime.local().zoneName;
			const { data } = await api.assetApi.getMemoryLane({ timezone });
			$memoryStore = data;
		}

		const queryIndex = $page.url.searchParams.get('index');
		if (queryIndex != null) {
			currentIndex = parseInt(queryIndex);
			if (isNaN(currentIndex)) {
				currentIndex = 0;
			}

			if (currentIndex > $memoryStore.onThisDay.length - 1) {
				currentIndex = 0;
			}
		}

		onThisDay = $memoryStore.onThisDay[currentIndex];
	});
</script>

<section class="w-full h-screen bg-immich-dark-gray">
	{#if $memoryStore}
		<ControlAppBar on:close-button-click={() => goto(AppRoute.PHOTOS)} backIcon={ArrowLeft}>
			<svelte:fragment slot="leading">
				{@const title = `${thisYear - $memoryStore.onThisDay[currentIndex].year} years since...`}
				<p class="text-lg">
					{title}
				</p>
			</svelte:fragment>
		</ControlAppBar>

		<!-- Viewer -->

		<section id="memory-viewer" class="pt-20">
			<div>left</div>
			<div>middle</div>
			<div>right</div>
		</section>
	{/if}
</section>
