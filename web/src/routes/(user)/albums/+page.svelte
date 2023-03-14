<script lang="ts">
	import AlbumCard from '$lib/components/album-page/album-card.svelte';
	import { goto } from '$app/navigation';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import type { PageData } from './$types';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import { useAlbums } from './albums.bloc';
	import empty1Url from '$lib/assets/empty-1.svg';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';

	export let data: PageData;

	const {
		albums,
		isShowContextMenu,
		contextMenuPosition,
		createAlbum,
		deleteSelectedContextAlbum,
		showAlbumContextMenu,
		closeAlbumContextMenu
	} = useAlbums({ albums: data.albums });

	const handleCreateAlbum = async () => {
		const newAlbum = await createAlbum();
		if (newAlbum) {
			goto('/albums/' + newAlbum.id);
		}
	};
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div slot="buttons">
		<button
			on:click={handleCreateAlbum}
			class="immich-text-button text-sm dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
		>
			<span>
				<PlusBoxOutline size="18" />
			</span>
			<p>Create album</p>
		</button>
	</div>

	<!-- Album Card -->
	<div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-8">
		{#each $albums as album}
			{#key album.id}
				<a data-sveltekit-preload-data="hover" href={`albums/${album.id}`}>
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
			on:click={handleCreateAlbum}
			on:keydown={handleCreateAlbum}
			class="border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 hover:cursor-pointer p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center"
		>
			<img src={empty1Url} alt="Empty shared album" width="500" draggable="false" />

			<p class="text-center text-immich-text-gray-500 dark:text-immich-dark-fg">
				Create an album to organize your photos and videos
			</p>
		</div>
	{/if}
</UserPageLayout>

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
