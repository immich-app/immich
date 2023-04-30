<script lang="ts">
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
	import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
	import { api } from '@api';
	import { onMount } from 'svelte';

	export let data: PageData;

	let personId = '';

	onMount(() => {
		personId = data.person.id;
	});
</script>

<section>
	<!-- {#if isMultiSelectionMode}
		<ControlAppBar
			on:close-button-click={clearMultiSelectAssetAssetHandler}
			backIcon={Close}
			tailwindClasses={'bg-white shadow-md'}
		>
			<svelte:fragment slot="leading">
				<p class="font-medium text-immich-primary dark:text-immich-dark-primary">
					Selected {selectedAssets.size.toLocaleString($locale)}
				</p>
			</svelte:fragment>
			<svelte:fragment slot="trailing">
				<CircleIconButton
					title="Share"
					logo={ShareVariantOutline}
					on:click={handleCreateSharedLink}
				/>

				<CircleIconButton
					title={isAllArchived ? 'Unarchive' : 'Archive'}
					logo={isAllArchived ? ArchiveArrowUpOutline : ArchiveArrowDownOutline}
					on:click={toggleArchive}
				/>

				<CircleIconButton
					title="Download"
					logo={CloudDownloadOutline}
					on:click={handleDownloadFiles}
				/>
				<CircleIconButton title="Add" logo={Plus} on:click={handleShowMenu} />
				<CircleIconButton
					title="Delete"
					logo={DeleteOutline}
					on:click={deleteSelectedAssetHandler}
				/>
			</svelte:fragment>
		</ControlAppBar>
	{:else} -->
	<ControlAppBar on:close-button-click={() => goto('/explore')} backIcon={ArrowLeft} />
	<!-- {/if} -->
</section>

<!-- Face information block -->
<section class="mt-24 ml-8 flex place-items-center">
	<ImageThumbnail
		circle
		shadow
		url={api.getPeopleThumbnailUrl(personId)}
		altText={data.person.name}
		widthStyle="50px"
		heightStyle="50px"
	/>
	<div class="ml-4 text-immich-primary dark:text-immich-dark-primary">
		{#if data.person.name}
			<p class="font-medium">{data.person.name}</p>
		{:else}
			<p
				class="font-medium hover:cursor-pointer w-fit"
				on:click={() => console.log('Activate name change')}
				on:keypress={() => {}}
			>
				Add a name
			</p>

			<p class="text-sm text-gray-500 dark:text-immich-gray">Find them fast by name with search</p>
		{/if}
	</div>
</section>

<!-- Gallery Block -->
<section class="relative pt-8 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
			{#if data.assets.length > 0}
				<div class="pl-4">
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
