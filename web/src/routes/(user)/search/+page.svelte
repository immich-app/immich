<script lang="ts">
	import { page } from '$app/stores';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const term = $page.url.searchParams.get('q') || '';
</script>

<section>
	<NavigationBar {term} user={data.user} shouldShowUploadButton={false} />
</section>

<section class="relative pt-[72px] h-screen bg-immich-bg  dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="search-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			{#if data.results?.assets?.items}
				<GalleryViewer assets={data.results.assets.items} />
			{/if}
		</section>
	</section>
</section>
