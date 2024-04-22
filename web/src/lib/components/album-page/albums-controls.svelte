<script lang="ts">
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumViewMode,
    albumViewSettings,
    SortOrder,
  } from '$lib/stores/preferences.store';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFilterOutline,
    mdiFolderArrowDownOutline,
    mdiFolderArrowUpOutline,
    mdiFolderRemoveOutline,
    mdiFormatListBulletedSquare,
    mdiMagnify,
    mdiPlusBoxOutline,
    mdiUnfoldLessHorizontal,
    mdiUnfoldMoreHorizontal,
    mdiViewGridOutline,
  } from '@mdi/js';
  import {
    type AlbumGroupOptionMetadata,
    type AlbumSortOptionMetadata,
    collapseAllAlbumGroups,
    createAlbumAndRedirect,
    expandAllAlbumGroups,
    findGroupOptionMetadata,
    findSortOptionMetadata,
    getSelectedAlbumGroupOption,
    groupOptionsMetadata,
    sortOptionsMetadata,
  } from '$lib/utils/album-utils';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import GroupTab from '$lib/components/elements/group-tab.svelte';
  import { fly } from 'svelte/transition';
  import { currentMediaBreakpoint, MediaBreakpoint } from '$lib/stores/media-breakpoint.store';

  export let albumGroups: string[];
  export let searchQuery: string;

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
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

  const closeSearchBar = () => {
    isSearchBarOpen = false;
  };

  let selectedGroupOption: AlbumGroupOptionMetadata;
  let groupIcon: string;
  let isSearchBarOpen = false;

  $: {
    selectedGroupOption = findGroupOptionMetadata($albumViewSettings.groupBy);
    if (selectedGroupOption.isDisabled()) {
      selectedGroupOption = findGroupOptionMetadata(AlbumGroupBy.None);
    }
  }

  $: showSearchBar = isSearchBarOpen || searchQuery || $currentMediaBreakpoint >= MediaBreakpoint.XL;

  $: selectedSortOption = findSortOptionMetadata($albumViewSettings.sortBy);

  $: {
    if (selectedGroupOption.id === AlbumGroupBy.None) {
      groupIcon = mdiFolderRemoveOutline;
    } else {
      groupIcon =
        $albumViewSettings.groupOrder === SortOrder.Desc ? mdiFolderArrowDownOutline : mdiFolderArrowUpOutline;
    }
  }

  $: sortIcon = $albumViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin;
</script>

<!-- VERY LARGE SCREENS: Filter Albums by Sharing Status (All, Owned, Shared) -->
<div class="hidden 2xl:block h-10">
  <GroupTab
    filters={Object.keys(AlbumFilter)}
    selected={$albumViewSettings.filter}
    onSelect={(selected) => ($albumViewSettings.filter = selected)}
  />
</div>

<!-- Search Albums -->
{#if $currentMediaBreakpoint >= MediaBreakpoint.XL}
  <div class="h-10 w-48 2xl:w-60">
    <SearchBar placeholder="Search albums" bind:name={searchQuery} isSearching={false} />
  </div>
{:else if showSearchBar}
  <div class="absolute left-0 right-0 z-10">
    <div
      class="ml-auto max-w-[700px]"
      transition:fly={{
        duration: 200,
      }}
    >
      <SearchBar
        placeholder="Search albums"
        bind:name={searchQuery}
        isSearching={false}
        focus
        on:blur={closeSearchBar}
        on:submit={closeSearchBar}
      />
    </div>
  </div>
{:else}
  <LinkButton on:click={() => (isSearchBarOpen = true)}>
    <div class="flex">
      <Icon path={mdiMagnify} size="18" />
    </div>
  </LinkButton>
{/if}

<!-- SMALL TO LARGE SCREENS: Filter Albums by Sharing Status -->
<div class="hidden 2xs:block 2xl:hidden">
  <Dropdown
    title="Filter albums"
    options={Object.keys(AlbumFilter)}
    selectedOption={$albumViewSettings.filter}
    on:select={({ detail }) => ($albumViewSettings.filter = detail)}
    render={(text) => ({
      title: text,
      icon: mdiFilterOutline,
    })}
  />
</div>

<!-- Create Album -->
<LinkButton on:click={() => createAlbumAndRedirect()}>
  <div class="flex place-items-center gap-2 text-sm">
    <Icon path={mdiPlusBoxOutline} size="18" />
    <p class="hidden md:block">Create album</p>
  </div>
</LinkButton>

<!-- Sort Albums -->
<Dropdown
  title="Sort albums by..."
  options={Object.values(sortOptionsMetadata)}
  selectedOption={selectedSortOption}
  on:select={({ detail }) => handleChangeSortBy(detail)}
  render={({ text }) => ({
    title: text,
    icon: sortIcon,
  })}
/>

<!-- Group Albums -->
<Dropdown
  title="Group albums by..."
  options={Object.values(groupOptionsMetadata)}
  selectedOption={selectedGroupOption}
  on:select={({ detail }) => handleChangeGroupBy(detail)}
  render={({ text, isDisabled }) => ({
    title: text,
    icon: groupIcon,
    disabled: isDisabled(),
  })}
/>

{#if getSelectedAlbumGroupOption($albumViewSettings) !== AlbumGroupBy.None}
  <!-- Expand Album Groups -->
  <div class="hidden xl:flex gap-0">
    <div class="block">
      <LinkButton title="Expand all" on:click={() => expandAllAlbumGroups()}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiUnfoldMoreHorizontal} size="18" />
        </div>
      </LinkButton>
    </div>

    <!-- Collapse Album Groups -->
    <div class="block">
      <LinkButton title="Collapse all" on:click={() => collapseAllAlbumGroups(albumGroups)}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiUnfoldLessHorizontal} size="18" />
        </div>
      </LinkButton>
    </div>
  </div>
{/if}

<!-- Cover/List Display Toggle -->
<LinkButton on:click={() => handleChangeListMode()}>
  <div class="flex place-items-center gap-2 text-sm">
    {#if $albumViewSettings.view === AlbumViewMode.List}
      <Icon path={mdiViewGridOutline} size="18" />
      <p class="hidden md:block">Covers</p>
    {:else}
      <Icon path={mdiFormatListBulletedSquare} size="18" />
      <p class="hidden md:block">List</p>
    {/if}
  </div>
</LinkButton>
