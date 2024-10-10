<script lang="ts">
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { PlacesGroupBy, placesViewSettings } from '$lib/stores/preferences.store';
  import {
    mdiFolderArrowUpOutline,
    mdiFolderRemoveOutline,
    mdiUnfoldLessHorizontal,
    mdiUnfoldMoreHorizontal,
  } from '@mdi/js';
  import {
    type PlacesGroupOptionMetadata,
    findGroupOptionMetadata,
    getSelectedPlacesGroupOption,
    groupOptionsMetadata,
    expandAllPlacesGroups,
    collapseAllPlacesGroups,
  } from '$lib/utils/places-utils';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  export let searchQuery: string;
  export let placesGroups: string[];

  const handleChangeGroupBy = ({ id }: PlacesGroupOptionMetadata) => {
    $placesViewSettings.groupBy = id;
  };

  let selectedGroupOption: PlacesGroupOptionMetadata;
  let groupIcon: string;

  $: {
    selectedGroupOption = findGroupOptionMetadata($placesViewSettings.groupBy);
    if (selectedGroupOption.isDisabled()) {
      selectedGroupOption = findGroupOptionMetadata(PlacesGroupBy.None);
    }
  }

  $: {
    groupIcon = selectedGroupOption.id === PlacesGroupBy.None ? mdiFolderRemoveOutline : mdiFolderArrowUpOutline; // OR mdiFolderArrowDownOutline
  }

  $: placesGroupByNames = ((): Record<PlacesGroupBy, string> => {
    return {
      [PlacesGroupBy.None]: $t('group_no'),
      [PlacesGroupBy.Country]: $t('group_country'),
    };
  })();
</script>

<!-- Search Places -->
<div class="hidden xl:block h-10 xl:w-60 2xl:w-80">
  <SearchBar placeholder={$t('search_places')} bind:name={searchQuery} showLoadingSpinner={false} />
</div>

<!-- Group Places -->
<Dropdown
  title={$t('group_places_by')}
  options={Object.values(groupOptionsMetadata)}
  selectedOption={selectedGroupOption}
  on:select={({ detail }) => handleChangeGroupBy(detail)}
  render={({ id, isDisabled }) => ({
    title: placesGroupByNames[id],
    icon: groupIcon,
    disabled: isDisabled(),
  })}
/>

{#if getSelectedPlacesGroupOption($placesViewSettings) !== PlacesGroupBy.None}
  <span in:fly={{ x: -50, duration: 250 }}>
    <!-- Expand Countries -->
    <div class="hidden xl:flex gap-0">
      <div class="block">
        <LinkButton title={$t('expand_all')} on:click={() => expandAllPlacesGroups()}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiUnfoldMoreHorizontal} size="18" />
          </div>
        </LinkButton>
      </div>

      <!-- Collapse Countries -->
      <div class="block">
        <LinkButton title={$t('collapse_all')} on:click={() => collapseAllPlacesGroups(placesGroups)}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiUnfoldLessHorizontal} size="18" />
          </div>
        </LinkButton>
      </div>
    </div>
  </span>
{/if}
