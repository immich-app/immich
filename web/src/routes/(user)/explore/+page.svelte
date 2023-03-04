<script lang="ts">
	import { goto } from '$app/navigation';
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import { SearchExploreItem } from '@api';
	import ClockOutline from 'svelte-material-icons/ClockOutline.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	enum Field {
		CITY = 'exifInfo.city',
		TAGS = 'smartInfo.tags'
	}

	let things: SearchExploreItem[] = [];
	let places: SearchExploreItem[] = [];

	for (const item of data.items) {
		switch (item.fieldName) {
			case Field.TAGS:
				things = item.items;
				break;

			case Field.CITY:
				places = item.items;
				break;
		}
	}
</script>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg dark:bg-immich-dark-bg"
>
	<SideBar />

	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="album-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<!-- Main Section -->
			<div class="px-4 flex justify-between place-items-center dark:text-immich-dark-fg">
				<div>
					<p class="font-medium">Explore</p>
				</div>
			</div>

			<div class="my-4">
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<div class="ml-4 mr-8 flex flex-col">
				{#if places.length > 0}
					<div class="mb-6 mt-2">
						<div>
							<p class="mb-4 dark:text-immich-dark-fg">Places</p>
						</div>
						<div class="flex flex-row gap-4">
							{#each places as item}
								<div class="relative">
									<div class="filter  brightness-75  rounded-xl overflow-hidden">
										<ImmichThumbnail
											isRoundedCorner={true}
											thumbnailSize={156}
											asset={item.data}
											readonly={true}
											on:click={() => goto(`/search?${Field.CITY}=${item.value}`)}
										/>
									</div>
									<span
										class="capitalize absolute bottom-2 w-full text-center text-sm font-medium text-white text-ellipsis w-100 hover:cursor-pointer backdrop-blur-[1px]"
										on:click={() => goto(`/search?${Field.CITY}=${item.value}`)}
										on:keydown={() => goto(`/search?${Field.CITY}=${item.value}`)}
									>
										{item.value}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if places.length > 0}
					<div class="mb-6 mt-2">
						<div>
							<p class="mb-4 dark:text-immich-dark-fg">Things</p>
						</div>
						<div class="flex flex-row gap-4">
							{#each things as item}
								<div class="relative">
									<div class="filter brightness-75 rounded-xl overflow-hidden">
										<ImmichThumbnail
											isRoundedCorner={true}
											thumbnailSize={156}
											asset={item.data}
											readonly={true}
											on:click={() => goto(`/search?${Field.TAGS}=${item.value}`)}
										/>
									</div>
									<span
										class="capitalize absolute bottom-2 w-full text-center text-sm font-medium text-white text-ellipsis w-100 hover:cursor-pointer backdrop-blur-[1px]"
										on:click={() => goto(`/search?${Field.CITY}=${item.value}`)}
										on:keydown={() => goto(`/search?${Field.CITY}=${item.value}`)}
									>
										{item.value}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<hr class="dark:border-immich-dark-gray mb-4" />

				<div class="flex flex-row gap-2">
					<div class="w-1/4">
						<p class="text-sm mb-4">YOUR ACTIVITY</p>
						<button
							class="mr-2 py-2 w-full flex text-base align-content-center gap-2"
							on:click={() => goto('/favorites')}
						>
							<StarOutline size={24} />
							<p class="text-base">Favorites</p>
						</button>
						<button
							class="mr-2 py-2 w-full flex text-base align-content-center gap-2"
							on:click={() => goto('/favorites')}
						>
							<ClockOutline size={24} />
							<p class="text-base">Recently added</p>
						</button>
					</div>
					<div class="w-1/2">
						<p class="text-sm mb-4">CATEGORIES</p>
						<button
							class="mr-2 py-2 w-full flex text-base align-content-center gap-2"
							on:click={() => goto('/search?type=VIDEO')}
						>
							<PlayCircleOutline size={24} />
							<p class="text-base">Videos</p>
						</button>
						<div class="w-1/2">
							<button
								class="mr-2 py-2 w-full flex text-base align-content-center gap-2"
								on:click={() => goto('/search?type=VIDEO')}
							>
								<MotionPlayOutline size={24} />
								<p class="text-base">Motion photos</p>
							</button>
						</div>
						<div class="w-1/2">
							<!--  -->
						</div>
					</div>
				</div>
			</div>
		</section>
	</section>
</section>
