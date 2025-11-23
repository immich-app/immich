<script lang="ts">
  import Dropdown from '$lib/elements/Dropdown.svelte';
  import {
    EventGroupBy,
    EventSortBy,
    eventViewSettings,
    SortOrder,
    type EventGroupOptionMetadata,
    type EventSortOptionMetadata,
  } from '$lib/stores/preferences.store';
  import {
    eventGroupOptionsMetadata,
    eventSortOptionsMetadata,
    findEventGroupOptionMetadata,
    findEventSortOptionMetadata,
  } from '$lib/utils/event-utils';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFolderArrowDownOutline,
    mdiFolderArrowUpOutline,
    mdiFolderRemoveOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

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

  let selectedSortOption = $derived(findEventSortOptionMetadata($eventViewSettings.sortBy));
  let selectedGroupOption = $derived(findEventGroupOptionMetadata($eventViewSettings.groupBy));
  let sortIcon = $derived($eventViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin);

  let eventSortByNames: Record<EventSortBy, string> = $derived({
    [EventSortBy.Name]: $t('sort_title'),
    [EventSortBy.DateModified]: $t('sort_modified'),
    [EventSortBy.DateCreated]: $t('sort_created'),
  });

  let eventGroupByNames: Record<EventGroupBy, string> = $derived({
    [EventGroupBy.None]: $t('group_no'),
    [EventGroupBy.Year]: $t('group_year'),
    [EventGroupBy.Owner]: $t('group_owner'),
  });
</script>

<!-- Sort Events -->
<Dropdown
  title={$t('sort_events_by')}
  options={Object.values(eventSortOptionsMetadata)}
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
  options={Object.values(eventGroupOptionsMetadata)}
  selectedOption={selectedGroupOption}
  onSelect={handleChangeGroupBy}
  render={({ id, isDisabled }) => ({
    title: eventGroupByNames[id],
    icon: groupIcon,
    disabled: isDisabled(),
  })}
/>
