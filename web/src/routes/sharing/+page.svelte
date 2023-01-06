<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import Link from 'svelte-material-icons/Link.svelte';

	import SharedAlbumListTile from '$lib/components/sharing-page/shared-album-list-tile.svelte';
	import { goto } from '$app/navigation';
	import { api } from '@api';
	import type { PageData } from './$types';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';

	export let data: PageData;

	const createSharedAlbum = async () => {
		try {
			const { data: newAlbum } = await api.albumApi.createAlbum({
				albumName: 'Untitled'
			});

			goto('/albums/' + newAlbum.id);
		} catch (e) {
			notificationController.show({
				message: 'Error creating album, check console for more details',
				type: NotificationType.Error
			});

			console.log('Error [createAlbum] ', e);
		}
	};
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg dark:bg-immich-dark-bg"
>
	<SideBar />

	<section class="overflow-y-auto relative">
		<section
			id="album-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<!-- Main Section -->
			<div class="px-4 flex justify-between place-items-center dark:text-immich-dark-fg">
				<div>
					<p class="font-medium">Sharing</p>
				</div>

				<div class="flex">
					<button
						on:click={createSharedAlbum}
						class="flex place-items-center gap-1 text-sm hover:bg-immich-primary/5 p-2 rounded-lg font-medium hover:text-gray-700 dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
					>
						<span>
							<PlusBoxOutline size="18" />
						</span>
						<p>Create shared album</p>
					</button>

					<button
						on:click={() => goto('/sharing/sharedlinks')}
						class="flex place-items-center gap-1 text-sm hover:bg-immich-primary/5 p-2 rounded-lg font-medium hover:text-gray-700 dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
					>
						<span>
							<Link size="18" />
						</span>
						<p>Shared links</p>
					</button>
				</div>
			</div>

			<div class="my-4">
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<!-- Share Album List -->
			<div class="w-full flex flex-col place-items-center">
				{#each data.sharedAlbums as album}
					<a data-sveltekit-preload-data="hover" href={`albums/${album.id}`}>
						<SharedAlbumListTile {album} user={data.user} />
					</a>
				{/each}
			</div>

			<!-- Empty List -->
			{#if data.sharedAlbums.length === 0}
				<div
					class="border dark:border-immich-dark-gray p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center dark:text-immich-dark-fg"
				>
					<img src="/empty-2.svg" alt="Empty shared album" width="500" />
					<p class="text-center text-immich-text-gray-500">
						Create a shared album to share photos and videos with people in your network
					</p>
				</div>
			{/if}
		</section>
	</section>
</section>
