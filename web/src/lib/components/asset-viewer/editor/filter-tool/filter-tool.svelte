<script lang="ts">
  import { editManager } from '$lib/managers/edit/edit-manager.svelte';
  import { filterManager } from '$lib/managers/edit/filter-manager.svelte';
  import { getAssetMediaUrl } from '$lib/utils';
  import { filters } from '$lib/utils/filters';
  import { AssetMediaSize } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let asset = $derived(editManager.currentAsset);
</script>

<div class="mt-3 px-4">
  <div class="flex h-10 w-full items-center justify-between text-sm mt-2">
    <h2>{$t('editor_filters')}</h2>
  </div>

  <div class="grid grid-cols-3 gap-4 mt-2">
    {#if asset}
      {#each filters as filter (filter.name)}
        {@const isSelected = filterManager.selectedFilter === filter}
        <button type="button" onclick={() => filterManager.selectFilter(filter)} class="flex flex-col items-center">
          <div class="w-20 h-20 rounded-md overflow-hidden {isSelected ? 'ring-3 ring-immich-primary' : ''}">
            <img
              src={getAssetMediaUrl({
                id: asset.id,
                cacheKey: asset.thumbhash,
                edited: false,
                size: AssetMediaSize.Thumbnail,
              })}
              alt="{filter.name} thumbnail"
              class="w-full h-full object-cover"
              style="filter: url(#{filter.cssId})"
            />
          </div>
          <Text size="small" class="mt-1" color={isSelected ? 'primary' : undefined}>{filter.name}</Text>
        </button>
      {/each}
    {/if}
  </div>

  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
    <defs>
      {#each filters as filter (filter.name)}
        <filter id={filter.cssId} color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values={filter.svgFilter} />
        </filter>
      {/each}
    </defs>
  </svg>
</div>
