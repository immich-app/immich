<script lang="ts">
	import { page } from '$app/stores';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import type { PageData } from './$types';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
	import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
	import { afterNavigate, goto } from '$app/navigation';

	export let data: PageData;

	// The GalleryViewer pushes it's own history state, which causes weird
	// behavior for history.back(). To prevent that we store the previous page
	// manually and navigate back to that.
	let previousRoute = '/explore';

	afterNavigate(({ from }) => {
		// Prevent setting previousRoute to the current page.
		if (from && from.route.id !== $page.route.id) {
			previousRoute = from.url.href;
		}
	});

	$: term = $page.url.searchParams.get('q') || data.term || '';
</script>

<section>
	<ControlAppBar on:close-button-click={() => goto(previousRoute)} backIcon={ArrowLeft}>
		<div class="w-full max-w-2xl flex-1 pl-4">
			<SearchBar grayTheme={false} value={term} />
		</div>
	</ControlAppBar>
</section>

<section class="relative pt-32 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
			{#if data.results?.assets?.items.length > 0}
				<div class="pl-4">
					<GalleryViewer
						assets={data.results.assets.items}
						disableAssetSelect
						viewFrom="search-page"
					/>
				</div>
			{:else}
				<div
					class="flex items-center place-content-center w-full min-h-[calc(100vh_-_11rem)] dark:text-white"
				>
					<div class="flex flex-col content-center items-center text-center">
						<ImageOffOutline size="3.5em" />
						<p class="font-medium text-3xl mt-5">No results</p>
						<p class="text-base font-normal">Try a synonym or more general keyword</p>
					</div>
				</div>
			{/if}
		</section>
	</section>
</section>
