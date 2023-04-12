<script lang="ts">
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
	import empty2Url from '$lib/assets/empty-2.svg';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import LinkButton from '$lib/components/elements/buttons/link-button.svelte';

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

<UserPageLayout user={data.user} title={data.meta.title}>
	<div class="flex" slot="buttons">
		<LinkButton on:click={createSharedAlbum}>
			<div class="flex place-items-center gap-1 text-sm">
				<PlusBoxOutline size="18" />
				Create shared album
			</div>
		</LinkButton>

		<LinkButton on:click={() => goto('/sharing/sharedlinks')}>
			<div class="flex place-items-center gap-1 text-sm">
				<Link size="18" />
				Shared links
			</div>
		</LinkButton>
	</div>

	<section>
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
				<img src={empty2Url} alt="Empty shared album" width="500" draggable="false" />
				<p class="text-center text-immich-text-gray-500">
					Create a shared album to share photos and videos with people in your network
				</p>
			</div>
		{/if}
	</section>
</UserPageLayout>
