<script lang="ts">
	import { page } from '$app/stores';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import type { PageData } from './$types';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
	import { afterNavigate, goto } from '$app/navigation';

	export let data: PageData;
	const term = $page.url.searchParams.get('q') || data.term || '';

	let goBackRoute = '/explore';
	afterNavigate((r) => {
		if (r.from) {
			goBackRoute = r.from.url.href;
		}
	});
</script>

<section>
	<ControlAppBar on:close-button-click={() => goto(goBackRoute)} backIcon={ArrowLeft}>
		<svelte:fragment slot="leading">
			<p class="text-xl capitalize">
				Search
				{#if term}
					- {term}
				{/if}
			</p>
		</svelte:fragment>
	</ControlAppBar>
</section>

<section class="relative pt-[72px] h-screen bg-immich-bg  dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="search-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			{#if data.results?.assets?.items.length != 0}
				<GalleryViewer assets={data.results.assets.items} />
			{:else}
				<div class="w-full text-center dark:text-white ">
					<div class="mt-60 flex flex-col place-content-center place-items-center">
						<ImageOffOutline size="56" />
						<p class="font-medium text-3xl mt-5">No results</p>
						<p class="text-base font-normal">Try a synonym or more general keyword</p>
					</div>
				</div>
			{/if}
		</section>
	</section>
</section>
