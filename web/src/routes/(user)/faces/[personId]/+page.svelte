<script lang="ts">
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="relative pt-32 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
			{#if data.assets.length > 0}
				<div class="pl-4">
					HELO NAME

					<GalleryViewer assets={data.assets} viewFrom="search-page" showArchiveIcon={true} />
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
