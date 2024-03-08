<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import type { SearchExploreResponseDto } from '@immich/sdk';
  import { mdiMapMarkerOff } from '@mdi/js';
  import type { PageData } from './$types';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';

  export let data: PageData;

  const CITY_FIELD = 'exifInfo.city';
  const getFieldItems = (items: SearchExploreResponseDto[]) => {
    const targetField = items.find((item) => item.fieldName === CITY_FIELD);
    return targetField?.items || [];
  };

  $: places = getFieldItems(data.items);
  $: hasPlaces = places.length > 0;

  let innerHeight: number;
</script>

<svelte:window bind:innerHeight />

<UserPageLayout title="Places">
  {#if hasPlaces}
    <div class="flex flex-row flex-wrap gap-4">
      {#each places as item (item.data.id)}
        <a class="relative" href="{AppRoute.SEARCH}?{getMetadataSearchQuery({ city: item.value })}" draggable="false">
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
  {:else}
    <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon path={mdiMapMarkerOff} size="3.5em" />
        <p class="mt-5 text-3xl font-medium">No places</p>
      </div>
    </div>
  {/if}
</UserPageLayout>
