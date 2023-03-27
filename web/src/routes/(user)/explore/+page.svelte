<script lang="ts">
	import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { AppRoute } from '$lib/constants';
	import { AssetTypeEnum, SearchExploreItem } from '@api';
	import ClockOutline from 'svelte-material-icons/ClockOutline.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	enum Field {
		CITY = 'exifInfo.city',
		TAGS = 'smartInfo.tags',
		OBJECTS = 'smartInfo.objects'
	}

	const MAX_ITEMS = 12;

	let things: SearchExploreItem[] = [];
	let places: SearchExploreItem[] = [];

	for (const item of data.items) {
		switch (item.fieldName) {
			case Field.OBJECTS:
				things = item.items;
				break;

			case Field.CITY:
				places = item.items;
				break;
		}
	}

	things = things.slice(0, MAX_ITEMS);
	places = places.slice(0, MAX_ITEMS);
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div class="mx-4 flex flex-col">
		{#if places.length > 0}
			<div class="mb-6 mt-2">
				<div>
					<p class="mb-4 dark:text-immich-dark-fg font-medium">Places</p>
				</div>
				<div class="flex flex-row flex-wrap gap-4">
					{#each places as item}
						<a class="relative" href="/search?{Field.CITY}={item.value}" draggable="false">
							<div class="filter brightness-75 rounded-xl overflow-hidden">
								<Thumbnail thumbnailSize={156} asset={item.data} readonly />
							</div>
							<span
								class="capitalize absolute bottom-2 w-full text-center text-sm font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
							>
								{item.value}
							</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		{#if things.length > 0}
			<div class="mb-6 mt-2">
				<div>
					<p class="mb-4 dark:text-immich-dark-fg font-medium">Things</p>
				</div>
				<div class="flex flex-row flex-wrap gap-4">
					{#each things as item}
						<a class="relative" href="/search?{Field.OBJECTS}={item.value}" draggable="false">
							<div class="filter brightness-75 rounded-xl overflow-hidden">
								<Thumbnail thumbnailSize={156} asset={item.data} readonly />
							</div>
							<span
								class="capitalize absolute bottom-2 w-full text-center text-sm font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
							>
								{item.value}
							</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<hr class="dark:border-immich-dark-gray mb-4" />

		<div
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
		>
			<div class="flex flex-col gap-6 dark:text-immich-dark-fg">
				<p class="text-sm">YOUR ACTIVITY</p>
				<div class="flex flex-col gap-4 dark:text-immich-dark-fg/80">
					<a
						href={AppRoute.FAVORITES}
						class="w-full flex text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary content-center gap-2"
						draggable="false"
					>
						<StarOutline size={24} />
						<span>Favorites</span>
					</a>
					<a
						href="/search?recent=true"
						class="w-full flex text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary content-center gap-2"
						draggable="false"
					>
						<ClockOutline size={24} />
						<span>Recently added</span>
					</a>
				</div>
			</div>
			<div class="flex flex-col gap-6 dark:text-immich-dark-fg">
				<p class="text-sm">CATEGORIES</p>
				<div class="flex flex-col gap-4 dark:text-immich-dark-fg/80">
					<a
						href="/search?type={AssetTypeEnum.Video}"
						class="w-full flex text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary items-center gap-2"
					>
						<PlayCircleOutline size={24} />
						<span>Videos</span>
					</a>
					<div>
						<a
							href="/search?motion=true"
							class="w-full flex text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary items-center gap-2"
						>
							<MotionPlayOutline size={24} />
							<span>Motion photos</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</UserPageLayout>
