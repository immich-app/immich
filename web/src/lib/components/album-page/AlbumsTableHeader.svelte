<script lang="ts">
  import { albumViewSettings, SortOrder, AlbumSortBy } from '$lib/stores/preferences.store';
  import type { AlbumSortOptionMetadata } from '$lib/utils/album-utils';
  import { t } from 'svelte-i18n';

  interface Props {
    option: AlbumSortOptionMetadata;
  }

  let { option }: Props = $props();

  const handleSort = () => {
    if ($albumViewSettings.sortBy === option.id) {
      $albumViewSettings.sortOrder = $albumViewSettings.sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
    } else {
      $albumViewSettings.sortBy = option.id;
      $albumViewSettings.sortOrder = option.defaultOrder;
    }
  };

  let albumSortByNames: Record<AlbumSortBy, string> = $derived({
    [AlbumSortBy.Title]: $t('sort_title'),
    [AlbumSortBy.ItemCount]: $t('sort_items'),
    [AlbumSortBy.DateModified]: $t('sort_modified'),
    [AlbumSortBy.DateCreated]: $t('sort_created'),
    [AlbumSortBy.MostRecentPhoto]: $t('sort_recent'),
    [AlbumSortBy.OldestPhoto]: $t('sort_oldest'),
  });
</script>

<th class="text-sm font-medium {option.columnStyle}">
  <button
    type="button"
    class="rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
    onclick={handleSort}
  >
    {#if $albumViewSettings.sortBy === option.id}
      {#if $albumViewSettings.sortOrder === SortOrder.Desc}
        &#8595;
      {:else}
        &#8593;
      {/if}
    {/if}
    {albumSortByNames[option.id]}
  </button>
</th>
