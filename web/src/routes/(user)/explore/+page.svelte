<script lang="ts">
	import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
	import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { AppRoute } from '$lib/constants';
	import { AssetTypeEnum, SearchExploreResponseDto, api } from '@api';
	import ClockOutline from 'svelte-material-icons/ClockOutline.svelte';
	import HeartMultipleOutline from 'svelte-material-icons/HeartMultipleOutline.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	enum Field {
		CITY = 'exifInfo.city',
		TAGS = 'smartInfo.tags',
		OBJECTS = 'smartInfo.objects'
	}

	const MAX_ITEMS = 12;

	const getFieldItems = (items: SearchExploreResponseDto[], field: Field) => {
		const targetField = items.find((item) => item.fieldName === field);
		return targetField?.items || [];
	};

	$: things = getFieldItems(data.items, Field.OBJECTS);
	$: places = getFieldItems(data.items, Field.CITY);
	$: people = data.people.slice(0, MAX_ITEMS);
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	{#if people.length > 0}
		<div class="mb-6 mt-2">
			<div class="flex justify-between">
				<p class="mb-4 dark:text-immich-dark-fg font-medium">People</p>
				{#if data.people.length > MAX_ITEMS}
					<a
						href={AppRoute.PEOPLE}
						class="font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary dark:text-immich-dark-fg"
						draggable="false">View All</a
					>
				{/if}
			</div>
			<div class="flex flex-row flex-wrap gap-4">
				{#each people as person (person.id)}
					<a href="/people/{person.id}" class="w-24 text-center">
						<ImageThumbnail
							circle
							shadow
							url={api.getPeopleThumbnailUrl(person.id)}
							altText={person.name}
							widthStyle="100%"
						/>
						<p class="font-medium mt-2 text-ellipsis text-sm dark:text-white">{person.name}</p>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if places.length > 0}
		<div class="mb-6 mt-2">
			<div>
				<p class="mb-4 dark:text-immich-dark-fg font-medium">Places</p>
			</div>
			<div class="flex flex-row flex-wrap gap-4">
				{#each places as item}
					<a class="relative" href="/search?{Field.CITY}={item.value}" draggable="false">
						<div
							class="filter brightness-75 rounded-xl overflow-hidden w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] flex justify-center"
						>
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
						<div
							class="filter brightness-75 rounded-xl overflow-hidden w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] justify-center flex"
						>
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

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
		<div class="flex flex-col gap-6 dark:text-immich-dark-fg">
			<p class="text-sm">YOUR ACTIVITY</p>
			<div class="flex flex-col gap-4 dark:text-immich-dark-fg/80">
				<a
					href={AppRoute.FAVORITES}
					class="w-full flex text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary content-center gap-2"
					draggable="false"
				>
					<HeartMultipleOutline size={24} />
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
</UserPageLayout>
