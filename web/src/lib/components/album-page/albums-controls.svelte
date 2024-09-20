<script lang="ts">
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    AlbumFilter,
    AlbumSortBy,
    AlbumGroupBy,
    AlbumViewMode,
    albumViewSettings,
    SortOrder,
  } from '$lib/stores/preferences.store';
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
  import {
    type AlbumGroupOptionMetadata,
    type AlbumSortOptionMetadata,
    findGroupOptionMetadata,
    findFilterOption,
    findSortOptionMetadata,
    getSelectedAlbumGroupOption,
    groupOptionsMetadata,
    sortOptionsMetadata,
  } from '$lib/utils/album-utils';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import GroupTab from '$lib/components/elements/group-tab.svelte';
  import { createAlbumAndRedirect, collapseAllAlbumGroups, expandAllAlbumGroups } from '$lib/utils/album-utils';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  export let albumGroups: string[];
  export let searchQuery: string;

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const handleChangeAlbumFilter = (filter: string, defaultFilter: AlbumFilter) => {
    $albumViewSettings.filter =
      Object.keys(albumFilterNames).find((key) => albumFilterNames[key as AlbumFilter] === filter) ?? defaultFilter;
  };

  const handleChangeGroupBy = ({ id, defaultOrder }: AlbumGroupOptionMetadata) => {
    if ($albumViewSettings.groupBy === id) {
      $albumViewSettings.groupOrder = flipOrdering($albumViewSettings.groupOrder);
    } else {
      $albumViewSettings.groupBy = id;
      $albumViewSettings.groupOrder = defaultOrder;
    }
  };

  const handleChangeSortBy = ({ id, defaultOrder }: AlbumSortOptionMetadata) => {
    if ($albumViewSettings.sortBy === id) {
      $albumViewSettings.sortOrder = flipOrdering($albumViewSettings.sortOrder);
    } else {
      $albumViewSettings.sortBy = id;
      $albumViewSettings.sortOrder = defaultOrder;
    }
  };

  const handleChangeListMode = () => {
    $albumViewSettings.view =
      $albumViewSettings.view === AlbumViewMode.Cover ? AlbumViewMode.List : AlbumViewMode.Cover;
  };

  let selectedGroupOption: AlbumGroupOptionMetadata;
  let groupIcon: string;

  $: selectedFilterOption = albumFilterNames[findFilterOption($albumViewSettings.filter)];

  $: selectedSortOption = findSortOptionMetadata($albumViewSettings.sortBy);

  $: {
    selectedGroupOption = findGroupOptionMetadata($albumViewSettings.groupBy);
    if (selectedGroupOption.isDisabled()) {
      selectedGroupOption = findGroupOptionMetadata(AlbumGroupBy.None);
    }
  }

  $: {
    if (selectedGroupOption.id === AlbumGroupBy.None) {
      groupIcon = mdiFolderRemoveOutline;
    } else {
      groupIcon =
        $albumViewSettings.groupOrder === SortOrder.Desc ? mdiFolderArrowDownOutline : mdiFolderArrowUpOutline;
    }
  }

  $: sortIcon = $albumViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin;

  $: albumFilterNames = ((): Record<AlbumFilter, string> => {
    return {
      [AlbumFilter.All]: $t('all'),
      [AlbumFilter.Owned]: $t('owned'),
      [AlbumFilter.Shared]: $t('shared'),
    };
  })();

  $: albumSortByNames = ((): Record<AlbumSortBy, string> => {
    return {
      [AlbumSortBy.Title]: $t('sort_title'),
      [AlbumSortBy.ItemCount]: $t('sort_items'),
      [AlbumSortBy.DateModified]: $t('sort_modified'),
      [AlbumSortBy.DateCreated]: $t('sort_created'),
      [AlbumSortBy.MostRecentPhoto]: $t('sort_recent'),
      [AlbumSortBy.OldestPhoto]: $t('sort_oldest'),
    };
  })();

  $: albumGroupByNames = ((): Record<AlbumGroupBy, string> => {
    return {
      [AlbumGroupBy.None]: $t('group_no'),
      [AlbumGroupBy.Owner]: $t('group_owner'),
      [AlbumGroupBy.Year]: $t('group_year'),
    };
  })();
</script>

<!-- Filter Albums by Sharing Status (All, Owned, Shared) -->
<div class="hidden xl:block h-10">
  <GroupTab
    label={$t('show_albums')}
    filters={Object.values(albumFilterNames)}
    selected={selectedFilterOption}
    onSelect={(selected) => handleChangeAlbumFilter(selected, AlbumFilter.All)}
  />
</div>

<!-- Search Albums -->
<div class="hidden xl:block h-10 xl:w-60 2xl:w-80">
  <SearchBar placeholder={$t('search_albums')} bind:name={searchQuery} showLoadingSpinner={false} />
</div>

<!-- Create Album -->
<LinkButton on:click={() => createAlbumAndRedirect()}>
  <div class="flex place-items-center gap-2 text-sm">
    <Icon path={mdiPlusBoxOutline} size="18" />
    <p class="hidden md:block">{$t('create_album')}</p>
  </div>
</LinkButton>

<!-- Sort Albums -->
<Dropdown
  title={$t('sort_albums_by')}
  options={Object.values(sortOptionsMetadata)}
  selectedOption={selectedSortOption}
  onSelect={handleChangeSortBy}
  render={({ id }) => ({
    title: albumSortByNames[id],
    icon: sortIcon,
  })}
/>

<!-- Group Albums -->
<Dropdown
  title={$t('group_albums_by')}
  options={Object.values(groupOptionsMetadata)}
  selectedOption={selectedGroupOption}
  onSelect={handleChangeGroupBy}
  render={({ id, isDisabled }) => ({
    title: albumGroupByNames[id],
    icon: groupIcon,
    disabled: isDisabled(),
  })}
/>

{#if getSelectedAlbumGroupOption($albumViewSettings) !== AlbumGroupBy.None}
  <span in:fly={{ x: -50, duration: 250 }}>
    <!-- Expand Album Groups -->
    <div class="hidden xl:flex gap-0">
      <div class="block">
        <LinkButton title={$t('expand_all')} on:click={() => expandAllAlbumGroups()}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiUnfoldMoreHorizontal} size="18" />
          </div>
        </LinkButton>
      </div>

      <!-- Collapse Album Groups -->
      <div class="block">
        <LinkButton title={$t('collapse_all')} on:click={() => collapseAllAlbumGroups(albumGroups)}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiUnfoldLessHorizontal} size="18" />
          </div>
        </LinkButton>
      </div>
    </div>
  </span>
{/if}

<!-- Cover/List Display Toggle -->
<LinkButton on:click={() => handleChangeListMode()}>
  <div class="flex place-items-center gap-2 text-sm">
    {#if $albumViewSettings.view === AlbumViewMode.List}
      <Icon path={mdiViewGridOutline} size="18" />
      <p class="hidden md:block">{$t('covers')}</p>
    {:else}
      <Icon path={mdiFormatListBulletedSquare} size="18" />
      <p class="hidden md:block">{$t('list')}</p>
    {/if}
  </div>
</LinkButton>
