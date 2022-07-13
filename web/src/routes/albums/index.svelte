<script context="module" lang="ts">
	export const prerender = false;

	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';

	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import { ImmichUser } from '$lib/models/immich-user';
	import type { Load } from '@sveltejs/kit';
	import SideBar from '$lib/components/shared/side-bar/side-bar.svelte';
	import { AlbumResponseDto, api } from '@api';
	import { fade, fly } from 'svelte/transition';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		let allAlbums: AlbumResponseDto[] = [];
		try {
			const { data } = await api.albumApi.getAllAlbums();
			allAlbums = data;
		} catch (e) {
			console.log('Error [getAllAlbums] ', e);
		}

		return {
			status: 200,
			props: {
				user: session.user,
				allAlbums: allAlbums,
			},
		};
	};
</script>

<script lang="ts">
	export let user: ImmichUser;
	export let allAlbums: AlbumResponseDto[];
	let imageData: string;

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, { responseType: 'blob' });
		if (data instanceof Blob) {
			imageData = URL.createObjectURL(data);
			return imageData;
		}
	};
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={() => {}} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />

	<!-- Main Section -->

	<section class="overflow-y-auto relative">
		<section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<div class="px-4 flex justify-between">
				<div>
					<p>Albums</p>
				</div>

				<div>
					<button
						class="flex place-items-center gap-1 text-sm hover:bg-immich-primary/5 p-2 rounded-lg font-medium hover:text-gray-700"
					>
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

			<div class="flex flex-wrap gap-8">
				{#each allAlbums as album}
					<div class="h-[339px] w-[275px] hover:cursor-pointer">
						<div class="h-[275px] w-[275px]">
							{#await loadImageData(album.albumThumbnailAssetId)}
								<div
									class={`bg-immich-primary/10 w-full h-full  flex place-items-center place-content-center rounded-xl`}
								>
									...
								</div>
							{:then imageData}
								<img
									in:fade={{ duration: 250 }}
									src={imageData}
									alt={album.id}
									class={`object-cover w-full h-full transition-all z-0 rounded-xl duration-300 hover:shadow-sm`}
									loading="lazy"
								/>
							{/await}
						</div>

						<div class="mt-2">
							<p class="text-sm font-medium text-gray-800">
								{album.albumName}
							</p>
							{#if album.shared}
								<p class="text-xs">Shared</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</section>
</section>
