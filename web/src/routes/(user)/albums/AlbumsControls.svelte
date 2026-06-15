<script lang="ts">
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumSortBy,
    AlbumViewMode,
    albumViewSettings,
    SortOrder,
  } from '$lib/stores/preferences.store';
  import {
    collapseAllAlbumGroups,
    createAlbumAndRedirect,
    expandAllAlbumGroups,
    findFilterOption,
    findGroupOptionMetadata,
    findSortOptionMetadata,
    getSelectedAlbumGroupOption,
    groupOptionsMetadata,
    sortOptionsMetadata,
  } from '$lib/utils/album-utils';
  import { Button, IconButton, Select, Text } from '@immich/ui';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFolderArrowDownOutline,
    mdiFolderArrowUpOutline,
    mdiFolderRemoveOutline,
    mdiFormatListBulletedSquare,
    mdiPlusBoxOutline,
    mdiUnfoldLessHorizontal,
    mdiUnfoldMoreHorizontal,
    mdiViewGridOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';

  type Props = {
    albumGroups: string[];
    searchQuery: string;
  };

  let { albumGroups, searchQuery = $bindable() }: Props = $props();

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const handleChangeAlbumFilter = (filter: string, defaultFilter: AlbumFilter) => {
    $albumViewSettings.filter =
      Object.keys(albumFilterNames).find((key) => albumFilterNames[key as AlbumFilter] === filter) ?? defaultFilter;
  };

  const handleChangeGroupBy = (id: string) =>
    ($albumViewSettings.groupOrder = findGroupOptionMetadata(id).defaultOrder);
  const handleChangeSortBy = (id: string) => {
    $albumViewSettings.sortOrder = findSortOptionMetadata(id).defaultOrder;
    if (findGroupOptionMetadata($albumViewSettings.groupBy).isDisabled()) {
      $albumViewSettings.groupBy = AlbumGroupBy.None;
    }
  };

  const handleChangeListMode = () => {
    $albumViewSettings.view =
      $albumViewSettings.view === AlbumViewMode.Cover ? AlbumViewMode.List : AlbumViewMode.Cover;
  };

  const groupByOptions = $derived.by(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    $albumViewSettings.sortBy; // ensure disabled status gets updated on change of sortBy
    return groupOptionsMetadata.map(({ id, isDisabled }) => ({
      value: id,
      label: albumGroupByNames[id],
      disabled: isDisabled(),
    }));
  });

  const groupIcon = $derived.by(() => {
    if ($albumViewSettings.groupBy === AlbumGroupBy.None) {
      return mdiFolderRemoveOutline;
    }
    return $albumViewSettings.groupOrder === SortOrder.Desc ? mdiFolderArrowDownOutline : mdiFolderArrowUpOutline;
  });

  const albumFilterNames: Record<AlbumFilter, string> = $derived({
    [AlbumFilter.All]: $t('all'),
    [AlbumFilter.Owned]: $t('owned'),
    [AlbumFilter.Shared]: $t('shared'),
  });

  let selectedFilterOption = $derived(albumFilterNames[findFilterOption($albumViewSettings.filter)]);

  const albumSortByNames: Record<AlbumSortBy, string> = $derived({
    [AlbumSortBy.Title]: $t('sort_title'),
    [AlbumSortBy.ItemCount]: $t('sort_items'),
    [AlbumSortBy.DateModified]: $t('sort_modified'),
    [AlbumSortBy.DateCreated]: $t('sort_created'),
    [AlbumSortBy.MostRecentPhoto]: $t('sort_recent'),
    [AlbumSortBy.OldestPhoto]: $t('sort_oldest'),
  });

  const albumGroupByNames: Record<AlbumGroupBy, string> = $derived({
    [AlbumGroupBy.None]: $t('group_no'),
    [AlbumGroupBy.Owner]: $t('group_owner'),
    [AlbumGroupBy.Year]: $t('group_year'),
  });
</script>

<!-- Filter Albums by Sharing Status (All, Owned, Shared) -->
<div class="hidden h-10 xl:block">
  <GroupTab
    label={$t('show_albums')}
    filters={Object.values(albumFilterNames)}
    selected={selectedFilterOption}
    onSelect={(selected) => handleChangeAlbumFilter(selected, AlbumFilter.All)}
  />
</div>

<!-- Search Albums -->
<div class="hidden h-10 xl:block xl:w-60 2xl:w-80">
  <SearchBar placeholder={$t('search_albums')} bind:name={searchQuery} showLoadingSpinner={false} />
</div>

<!-- Create Album -->
<Button
  leadingIcon={mdiPlusBoxOutline}
  onclick={() => createAlbumAndRedirect()}
  size="small"
  variant="ghost"
  color="secondary"
>
  <p class="hidden md:block">{$t('create_album')}</p>
</Button>

<!-- Sort Albums -->
<IconButton
  icon={$albumViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin}
  aria-label={$t('switch_sort_order', {
    values: {
      from: $albumViewSettings.sortOrder,
      to: $albumViewSettings.sortOrder === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
    },
  })}
  onclick={() => ($albumViewSettings.sortOrder = flipOrdering($albumViewSettings.sortOrder))}
  variant="ghost"
  color="secondary"
/>
<div title={$t('sort_albums_by')}>
  <Select
    bind:value={$albumViewSettings.sortBy}
    options={sortOptionsMetadata.map(({ id }) => ({ value: id, label: albumSortByNames[id] }))}
    onChange={handleChangeSortBy}
    class="w-fit min-w-45"
  />
</div>

<!-- Group Albums -->
<IconButton
  icon={groupIcon}
  aria-label={$albumViewSettings.groupBy === AlbumGroupBy.None
    ? $t('not_available')
    : $t('switch_sort_order', {
        values: {
          from: $albumViewSettings.groupOrder,
          to: $albumViewSettings.groupOrder === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        },
      })}
  onclick={() => ($albumViewSettings.groupOrder = flipOrdering($albumViewSettings.groupOrder))}
  disabled={$albumViewSettings.groupBy === AlbumGroupBy.None}
  variant="ghost"
  color="secondary"
/>
<div title={$t('group_albums_by')}>
  <Select
    bind:value={$albumViewSettings.groupBy}
    options={groupByOptions}
    onChange={handleChangeGroupBy}
    class="w-fit min-w-45"
  />
</div>

{#if getSelectedAlbumGroupOption($albumViewSettings) !== AlbumGroupBy.None}
  <span transition:slide={{ axis: 'x', duration: 250 }}>
    <div class="hidden gap-0 xl:flex">
      <!-- Expand Album Groups -->
      <div class="block">
        <IconButton
          onclick={() => expandAllAlbumGroups()}
          variant="ghost"
          color="secondary"
          shape="round"
          icon={mdiUnfoldMoreHorizontal}
          aria-label={$t('expand_all')}
        />
      </div>

      <!-- Collapse Album Groups -->
      <div class="block">
        <IconButton
          onclick={() => collapseAllAlbumGroups(albumGroups)}
          variant="ghost"
          color="secondary"
          shape="round"
          icon={mdiUnfoldLessHorizontal}
          aria-label={$t('collapse_all')}
        />
      </div>
    </div>
  </span>
{/if}

<!-- Cover/List Display Toggle -->
<Button
  leadingIcon={$albumViewSettings.view === AlbumViewMode.List ? mdiViewGridOutline : mdiFormatListBulletedSquare}
  onclick={() => handleChangeListMode()}
  size="small"
  variant="ghost"
  color="secondary"
>
  <Text class="hidden md:block">{$albumViewSettings.view === AlbumViewMode.List ? $t('covers') : $t('list')}</Text>
</Button>
