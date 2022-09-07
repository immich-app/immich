<script lang="ts">
	import AlbumCard from '$lib/components/album-page/album-card.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import type { PageData } from './$types';
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import { useAlbums } from './albums-bloc';

	export let data: PageData;

	const {
		albums,
		isShowContextMenu,
		contextMenuPosition,
		createAlbum,
		deleteSelectedContextAlbum,
		loadAlbums,
		showAlbumContextMenu,
		closeAlbumContextMenu
	} = useAlbums({ albums: data.albums });

	onMount(loadAlbums);

	const handleCreateAlbum = async () => {
		const newAlbum = await createAlbum();
		if (newAlbum) {
			goto('/albums/' + newAlbum.id);
		}
	};
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg ">
	<SideBar />

	<!-- Main Section -->

	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<div class="px-4 flex justify-between place-items-center">
				<div>
					<p class="font-medium">Albums</p>
				</div>

				<div>
					<button on:click={handleCreateAlbum} class="immich-text-button text-sm">
						<span>
							<PlusBoxOutline size="18" />
						</span>
						<p>Create album</p>
					</button>
				</div>
			</div>

			<div class="my-4">
				<hr />
			</div>

			<!-- Album Card -->
			<div class="flex flex-wrap gap-8">
				{#each $albums as album}
					{#key album.id}
						<a sveltekit:prefetch href={`albums/${album.id}`}>
							<AlbumCard
								{album}
								on:showalbumcontextmenu={(e) => showAlbumContextMenu(e.detail, album)}
							/>
						</a>
					{/key}
				{/each}
			</div>

			<!-- Empty Message -->
			{#if $albums.length === 0}
				<div
					class="border p-5 w-[50%] m-auto mt-10 bg-gray-50 rounded-3xl flex flex-col place-content-center place-items-center"
				>
					<img src="/empty-1.svg" alt="Empty shared album" width="500" />

					<p class="text-center text-immich-text-gray-500">
						Create an album to organize your photos and videos
					</p>
				</div>
			{/if}
		</section>
	</section>

	<!-- Context Menu -->
	{#if $isShowContextMenu}
		<ContextMenu {...$contextMenuPosition} on:clickoutside={closeAlbumContextMenu}>
			<MenuOption on:click={deleteSelectedContextAlbum}>
				<span class="flex place-items-center place-content-center gap-2">
					<DeleteOutline size="18" />
					<p>Delete album</p>
				</span>
			</MenuOption>
		</ContextMenu>
	{/if}
</section>
