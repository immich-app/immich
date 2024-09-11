<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiMapMarkerOff } from '@mdi/js';
  import type { PageData } from './$types';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { getAssetThumbnailUrl } from '$lib/utils';

  export let data: PageData;

  type AssetWithCity = AssetResponseDto & {
    exifInfo: {
      city: string;
    };
  };

  $: places = data.items.filter((item): item is AssetWithCity => !!item.exifInfo?.city);
  $: hasPlaces = places.length > 0;

  let innerHeight: number;
</script>

<svelte:window bind:innerHeight />

<UserPageLayout title={$t('places')}>
  {#if hasPlaces}
    <div class="flex flex-row flex-wrap gap-4">
      {#each places as item (item.id)}
        {@const city = item.exifInfo.city}
        <a class="relative" href="{AppRoute.SEARCH}?{getMetadataSearchQuery({ city })}" draggable="false">
          <div
            class="flex w-[calc((100vw-(72px+5rem))/2)] max-w-[156px] justify-center overflow-hidden rounded-xl brightness-75 filter"
          >
            <img
              src={getAssetThumbnailUrl({ id: item.id, size: AssetMediaSize.Thumbnail })}
              alt={city}
              class="object-cover w-[156px] h-[156px]"
            />
          </div>
          <span
            class="w-100 absolute bottom-2 w-full text-ellipsis px-1 text-center text-sm font-medium capitalize text-white backdrop-blur-[1px] hover:cursor-pointer"
          >
            {city}
          </span>
        </a>
      {/each}
    </div>
  {:else}
    <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon path={mdiMapMarkerOff} size="3.5em" />
        <p class="mt-5 text-3xl font-medium">{$t('no_places')}</p>
      </div>
    </div>
  {/if}
</UserPageLayout>
