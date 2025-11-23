<script lang="ts">
  import Dropdown from '$lib/elements/Dropdown.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { EventGroupBy, EventSortBy, eventViewSettings, SortOrder } from '$lib/stores/preferences.store';
  import {
    type EventGroupOptionMetadata,
    type EventSortOptionMetadata,
    collapseAllEventGroups,
    expandAllEventGroups,
    findGroupOptionMetadata,
    findSortOptionMetadata,
    getSelectedEventGroupOption,
    groupOptionsMetadata,
    sortOptionsMetadata,
  } from '$lib/utils/event-utils';
  import { IconButton } from '@immich/ui';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFolderArrowDownOutline,
    mdiFolderArrowUpOutline,
    mdiFolderRemoveOutline,
    mdiUnfoldLessHorizontal,
    mdiUnfoldMoreHorizontal,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  interface Props {
    eventGroups: string[];
    searchQuery: string;
  }

  let { eventGroups, searchQuery = $bindable() }: Props = $props();

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const handleChangeGroupBy = ({ id, defaultOrder }: EventGroupOptionMetadata) => {
    if ($eventViewSettings.groupBy === id) {
      $eventViewSettings.groupOrder = flipOrdering($eventViewSettings.groupOrder);
    } else {
      $eventViewSettings.groupBy = id;
      $eventViewSettings.groupOrder = defaultOrder;
    }
  };

  const handleChangeSortBy = ({ id, defaultOrder }: EventSortOptionMetadata) => {
    if ($eventViewSettings.sortBy === id) {
      $eventViewSettings.sortOrder = flipOrdering($eventViewSettings.sortOrder);
    } else {
      $eventViewSettings.sortBy = id;
      $eventViewSettings.sortOrder = defaultOrder;
    }
  };

  let groupIcon = $derived.by(() => {
    if (selectedGroupOption?.id === EventGroupBy.None) {
      return mdiFolderRemoveOutline;
    }
    return $eventViewSettings.groupOrder === SortOrder.Desc ? mdiFolderArrowDownOutline : mdiFolderArrowUpOutline;
  });

  let selectedSortOption = $derived(findSortOptionMetadata($eventViewSettings.sortBy));
  let selectedGroupOption = $derived(findGroupOptionMetadata($eventViewSettings.groupBy));
  let sortIcon = $derived($eventViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin);

  let eventSortByNames: Record<EventSortBy, string> = $derived({
    [EventSortBy.Name]: $t('sort_name'),
    [EventSortBy.AlbumCount]: $t('sort_albums'),
    [EventSortBy.DateModified]: $t('sort_modified'),
    [EventSortBy.DateCreated]: $t('sort_created'),
  });

  let eventGroupByNames: Record<EventGroupBy, string> = $derived({
    [EventGroupBy.None]: $t('group_no'),
    [EventGroupBy.Year]: $t('group_year'),
  });
</script>

<!-- Search Events -->
<div class="hidden xl:block h-10 xl:w-60 2xl:w-80">
  <SearchBar placeholder={$t('search_events')} bind:name={searchQuery} showLoadingSpinner={false} />
</div>

<!-- Sort Events -->
<Dropdown
  title={$t('sort_events_by')}
  options={Object.values(sortOptionsMetadata)}
  selectedOption={selectedSortOption}
  onSelect={handleChangeSortBy}
  render={({ id }) => ({
    title: eventSortByNames[id],
    icon: sortIcon,
  })}
/>

<!-- Group Events -->
<Dropdown
  title={$t('group_events_by')}
  options={Object.values(groupOptionsMetadata)}
  selectedOption={selectedGroupOption}
  onSelect={handleChangeGroupBy}
  render={({ id, isDisabled }) => ({
    title: eventGroupByNames[id],
    icon: groupIcon,
    disabled: isDisabled(),
  })}
/>

{#if getSelectedEventGroupOption($eventViewSettings) !== EventGroupBy.None}
  <span in:fly={{ x: -50, duration: 250 }}>
    <!-- Expand Event Groups -->
    <div class="hidden xl:flex gap-0">
      <div class="block">
        <IconButton
          title={$t('expand_all')}
          onclick={() => expandAllEventGroups()}
          variant="ghost"
          color="secondary"
          shape="round"
          icon={mdiUnfoldMoreHorizontal}
          aria-label={$t('expand_all')}
        />
      </div>

      <!-- Collapse Event Groups -->
      <div class="block">
        <IconButton
          title={$t('collapse_all')}
          onclick={() => collapseAllEventGroups(eventGroups)}
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
