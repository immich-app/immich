<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { AssetTypeEnum, SearchExploreResponseDto, api } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { PageData } from './$types';
  import {
    mdiHeartMultipleOutline,
    mdiClockOutline,
    mdiPlayCircleOutline,
    mdiMotionPlayOutline,
    mdiRotate360,
  } from '@mdi/js';

  export let data: PageData;

  enum Field {
    CITY = 'exifInfo.city',
    TAGS = 'smartInfo.tags',
    OBJECTS = 'smartInfo.objects',
  }

  let MAX_ITEMS: number;
  let innerWidth: number;
  let screenSize: number;
  const getFieldItems = (items: SearchExploreResponseDto[], field: Field) => {
    const targetField = items.find((item) => item.fieldName === field);
    return targetField?.items || [];
  };

  $: things = getFieldItems(data.items, Field.OBJECTS);
  $: places = getFieldItems(data.items, Field.CITY);
  $: people = data.response.people.slice(0, MAX_ITEMS);
  $: hasPeople = data.response.total > 0;
  $: {
    if (innerWidth && screenSize) {
      // Set the number of faces according to the screen size and the div size
      MAX_ITEMS = screenSize < 768 ? Math.floor(innerWidth / 96) : Math.floor(innerWidth / 112);
    }
  }
</script>

<svelte:window bind:innerWidth={screenSize} />

<UserPageLayout user={data.user} title={data.meta.title}>
  {#if hasPeople}
    <div class="mb-6 mt-2">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">People</p>
        <a
          href={AppRoute.PEOPLE}
          class="pr-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">View All</a
        >
      </div>
      <div class="flex flex-row {MAX_ITEMS < 5 ? 'justify-center' : ''} flex-wrap gap-4" bind:offsetWidth={innerWidth}>
        {#if MAX_ITEMS}
          {#each people as person (person.id)}
            <a href="/people/{person.id}" class="w-20 md:w-24 text-center">
              <ImageThumbnail
                circle
                shadow
                url={api.getPeopleThumbnailUrl(person.id)}
                altText={person.name}
                widthStyle="100%"
              />
              <p class="mt-2 text-ellipsis text-sm font-medium dark:text-white">{person.name}</p>
            </a>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  {#if places.length > 0}
    <div class="mb-6 mt-2">
      <div>
        <p class="mb-4 font-medium dark:text-immich-dark-fg">Places</p>
      </div>
      <div class="flex flex-row flex-wrap gap-4">
        {#each places as item}
          <a class="relative" href="/search?{Field.CITY}={item.value}" draggable="false">
            <div
              class="flex w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] justify-center overflow-hidden rounded-xl brightness-75 filter"
            >
              <Thumbnail thumbnailSize={156} asset={item.data} readonly />
            </div>
            <span
              class="w-100 absolute bottom-2 w-full text-ellipsis px-1 text-center text-sm font-medium capitalize text-white backdrop-blur-[1px] hover:cursor-pointer"
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
        <p class="mb-4 font-medium dark:text-immich-dark-fg">Things</p>
      </div>
      <div class="flex flex-row flex-wrap gap-4">
        {#each things as item}
          <a class="relative" href="/search?{Field.OBJECTS}={item.value}" draggable="false">
            <div
              class="flex w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] justify-center overflow-hidden rounded-xl brightness-75 filter"
            >
              <Thumbnail thumbnailSize={156} asset={item.data} readonly />
            </div>
            <span
              class="w-100 absolute bottom-2 w-full text-ellipsis px-1 text-center text-sm font-medium capitalize text-white backdrop-blur-[1px] hover:cursor-pointer"
            >
              {item.value}
            </span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <hr class="mb-4 dark:border-immich-dark-gray" />

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    <div class="flex flex-col gap-6 dark:text-immich-dark-fg">
      <p class="text-sm">YOUR ACTIVITY</p>
      <div class="flex flex-col gap-4 dark:text-immich-dark-fg/80">
        <a
          href={AppRoute.FAVORITES}
          class="flex w-full content-center gap-2 text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
          draggable="false"
        >
          <Icon path={mdiHeartMultipleOutline} size={24} />
          <span>Favorites</span>
        </a>
        <a
          href="/search?recent=true"
          class="flex w-full content-center gap-2 text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
          draggable="false"
        >
          <Icon path={mdiClockOutline} size={24} />
          <span>Recently added</span>
        </a>
      </div>
    </div>
    <div class="flex flex-col gap-6 dark:text-immich-dark-fg">
      <p class="text-sm">CATEGORIES</p>
      <div class="flex flex-col gap-4 dark:text-immich-dark-fg/80">
        <a
          href="/search?type={AssetTypeEnum.Video}"
          class="flex w-full items-center gap-2 text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
        >
          <Icon path={mdiPlayCircleOutline} size={24} />
          <span>Videos</span>
        </a>
        <div>
          <a
            href="/search?motion=true"
            class="flex w-full items-center gap-2 text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
          >
            <Icon path={mdiMotionPlayOutline} size={24} />
            <span>Motion photos</span>
          </a>
        </div>
        <div>
          <a
            href="/search?exifInfo.projectionType=EQUIRECTANGULAR"
            class="flex w-full items-center gap-2 text-sm font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
          >
            <Icon path={mdiRotate360} size={24} />
            <span>Panorama photos</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</UserPageLayout>
