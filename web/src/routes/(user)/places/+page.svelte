<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { type SearchExploreResponseDto, api } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;

  enum Field {
    CITY = 'exifInfo.city',
  }

  let MAX_PLACE_ITEMS: number;
  let innerWidth: number;
  let screenSize: number;
  const getFieldItems = (items: SearchExploreResponseDto[], field: Field) => {
    const targetField = items.find((item) => item.fieldName === field);
    return targetField?.items || [];
  };

  $: places = getFieldItems(data.items, Field.CITY).slice(0, MAX_PLACE_ITEMS);
  $: {
    if (innerWidth && screenSize) {
      // Set the number of faces according to the screen size and the div size
      MAX_PLACE_ITEMS = screenSize < 768 ? Math.floor(innerWidth / 150) : Math.floor(innerWidth / 172);
    }
  }
</script>

<svelte:window bind:innerWidth={screenSize} />

<UserPageLayout title={data.meta.title}>

  {#if places.length > 0}
    <div class="mb-6 mt-2">
      <div class="flex flex-row flex-wrap gap-4">
        {#each places as item (item.data.id)}
          <a class="relative" href="{AppRoute.SEARCH}?q={item.value}" draggable="false">
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
</UserPageLayout>
