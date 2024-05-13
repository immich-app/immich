<script lang="ts">
  import { albumViewSettings, SortOrder } from '$lib/stores/preferences.store';
  import type { AlbumSortOptionMetadata } from '$lib/utils/album-utils';

  export let option: AlbumSortOptionMetadata;

  const handleSort = () => {
    if ($albumViewSettings.sortBy === option.id) {
      $albumViewSettings.sortOrder = $albumViewSettings.sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
    } else {
      $albumViewSettings.sortBy = option.id;
      $albumViewSettings.sortOrder = option.defaultOrder;
    }
  };
</script>

<th class="text-sm font-medium {option.columnStyle}">
  <button
    class="rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
    on:click={handleSort}
  >
    {#if $albumViewSettings.sortBy === option.id}
      {#if $albumViewSettings.sortOrder === SortOrder.Desc}
        &#8595;
      {:else}
        &#8593;
      {/if}
    {/if}
    {option.text}
  </button>
</th>
