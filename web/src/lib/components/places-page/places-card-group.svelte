<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { placesViewSettings } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { type PlacesGroup, isPlacesGroupCollapsed, togglePlacesGroupCollapsing } from '$lib/utils/places-utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    places: AssetResponseDto[];
    group?: PlacesGroup | undefined;
  }

  let { places, group = undefined }: Props = $props();

  let isCollapsed = $derived(!!group && isPlacesGroupCollapsed($placesViewSettings, group.id));
  let iconRotation = $derived(isCollapsed ? 'rotate-0' : 'rotate-90');
</script>

{#if group}
  <div class="grid">
    <button
      type="button"
      onclick={() => togglePlacesGroupCollapsing(group.id)}
      class="w-fit mt-2 pt-2 pe-2 mb-2 dark:text-immich-dark-fg"
      aria-expanded={!isCollapsed}
    >
      <Icon icon={mdiChevronRight} size="24" class="inline-block -mt-2.5 transition-all duration-250 {iconRotation}" />
      <span class="font-bold text-3xl text-black dark:text-white">{group.name}</span>
      <span class="ms-1.5">({$t('places_count', { values: { count: places.length } })})</span>
    </button>
    <hr class="dark:border-immich-dark-gray" />
  </div>
{/if}

<div class="mt-4">
  {#if !isCollapsed}
    <div class="flex flex-row flex-wrap gap-4">
      {#each places as item (item.id)}
        {@const city = item.exifInfo?.city}
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
            class="absolute bottom-2 w-full text-ellipsis px-1 text-center text-sm font-medium capitalize text-white backdrop-blur-[1px] hover:cursor-pointer"
          >
            {city}
          </span>
        </a>
      {/each}
    </div>
  {/if}
</div>
