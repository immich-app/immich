<script lang="ts">
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AlbumFilter, AlbumViewMode, albumViewSettings } from '$lib/stores/preferences.store';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFormatListBulletedSquare,
    mdiPlusBoxOutline,
    mdiViewGridOutline,
  } from '@mdi/js';
  import { sortByOptions, type Sort, handleCreateAlbum } from '$lib/components/album-page/albums-list.svelte';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import GroupTab from '$lib/components/elements/group-tab.svelte';

  export let searchAlbum: string;

  const searchSort = (searched: string): Sort => {
    return sortByOptions.find((option) => option.title === searched) || sortByOptions[0];
  };

  const handleChangeListMode = () => {
    $albumViewSettings.view =
      $albumViewSettings.view === AlbumViewMode.Cover ? AlbumViewMode.List : AlbumViewMode.Cover;
  };
</script>

<div class="hidden xl:block">
  <GroupTab
    filters={Object.keys(AlbumFilter)}
    selected={$albumViewSettings.filter}
    onSelect={(selected) => ($albumViewSettings.filter = selected)}
  />
</div>
<div class="hidden xl:block xl:w-60 2xl:w-80 h-10">
  <SearchBar placeholder="Search albums" bind:name={searchAlbum} isSearching={false} />
</div>
<LinkButton on:click={handleCreateAlbum}>
  <div class="flex place-items-center gap-2 text-sm">
    <Icon path={mdiPlusBoxOutline} size="18" />
    <p class="hidden md:block">Create album</p>
  </div>
</LinkButton>

<Dropdown
  options={Object.values(sortByOptions)}
  selectedOption={searchSort($albumViewSettings.sortBy)}
  render={(option) => {
    return {
      title: option.title,
      icon: option.sortDesc ? mdiArrowDownThin : mdiArrowUpThin,
    };
  }}
  on:select={(event) => {
    for (const key of sortByOptions) {
      if (key.title === event.detail.title) {
        key.sortDesc = !key.sortDesc;
        $albumViewSettings.sortBy = key.title;
        break;
      }
    }
  }}
/>

<LinkButton on:click={() => handleChangeListMode()}>
  <div class="flex place-items-center gap-2 text-sm">
    {#if $albumViewSettings.view === AlbumViewMode.List}
      <Icon path={mdiViewGridOutline} size="18" />
      <p class="hidden sm:block">Cover</p>
    {:else}
      <Icon path={mdiFormatListBulletedSquare} size="18" />
      <p class="hidden sm:block">List</p>
    {/if}
  </div>
</LinkButton>
