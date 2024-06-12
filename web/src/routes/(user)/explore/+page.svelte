<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type SearchExploreResponseDto } from '@immich/sdk';
  import type { PageData } from './$types';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { t } from 'svelte-i18n';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';

  export let data: PageData;

  enum Field {
    CITY = 'exifInfo.city',
    TAGS = 'smartInfo.tags',
    OBJECTS = 'smartInfo.objects',
  }

  let MAX_PEOPLE_ITEMS: number;
  let MAX_PLACE_ITEMS: number;
  let innerWidth: number;
  let screenSize: number;
  const getFieldItems = (items: SearchExploreResponseDto[], field: Field) => {
    const targetField = items.find((item) => item.fieldName === field);
    return targetField?.items || [];
  };

  $: places = getFieldItems(data.items, Field.CITY).slice(0, MAX_PLACE_ITEMS);
  $: people = data.response.people.slice(0, MAX_PEOPLE_ITEMS);
  $: hasPeople = data.response.total > 0;
  $: {
    if (innerWidth && screenSize) {
      // Set the number of faces according to the screen size and the div size
      MAX_PEOPLE_ITEMS = screenSize < 768 ? Math.floor(innerWidth / 96) : Math.floor(innerWidth / 120);
      MAX_PLACE_ITEMS = screenSize < 768 ? Math.floor(innerWidth / 150) : Math.floor(innerWidth / 172);
    }
  }
</script>

<svelte:window bind:innerWidth={screenSize} />

<UserPageLayout title={data.meta.title}>
  {#if hasPeople}
    <div class="mb-6 mt-2">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('people')}</p>
        <a
          href={AppRoute.PEOPLE}
          class="pr-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <div
        class="flex flex-row {MAX_PEOPLE_ITEMS < 5 ? 'justify-center' : ''} flex-wrap gap-4"
        bind:offsetWidth={innerWidth}
      >
        {#if MAX_PEOPLE_ITEMS}
          {#each people as person (person.id)}
            <a href="{AppRoute.PEOPLE}/{person.id}" class="w-20 md:w-24 text-center">
              <ImageThumbnail
                circle
                shadow
                url={getPeopleThumbnailUrl(person.id)}
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
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('places')}</p>
        <a
          href={AppRoute.PLACES}
          class="pr-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <div class="flex flex-row flex-wrap gap-4">
        {#each places as item (item.data.id)}
          <a class="relative" href="{AppRoute.SEARCH}?{getMetadataSearchQuery({ city: item.value })}" draggable="false">
            <div
              class="flex w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] justify-center overflow-hidden rounded-xl brightness-75 filter"
            >
              <img
                src={getAssetThumbnailUrl({ id: item.data.id, size: AssetMediaSize.Thumbnail })}
                alt={item.value}
                class="object-cover w-[156px] h-[156px]"
              />
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

  {#if !hasPeople && places.length === 0}
    <EmptyPlaceholder text={$t('no_explore_results_message')} />
  {/if}
</UserPageLayout>
