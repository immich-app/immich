<script lang="ts">
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { PlacesGroupBy, placesViewSettings } from '$lib/stores/preferences.store';
  import { collapseAllPlacesGroups, expandAllPlacesGroups } from '$lib/utils/places-utils';
  import { IconButton, Select } from '@immich/ui';
  import { mdiUnfoldLessHorizontal, mdiUnfoldMoreHorizontal } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';

  interface Props {
    placesGroups: string[];
    searchQuery: string;
  }

  let { placesGroups, searchQuery = $bindable() }: Props = $props();

  let options = $derived([
    { value: PlacesGroupBy.None, label: $t('group_no') },
    { value: PlacesGroupBy.Country, label: $t('group_country') },
  ]);
</script>

<div class="hidden h-10 md:block xl:w-60 2xl:w-80">
  <SearchBar placeholder={$t('search_places')} bind:name={searchQuery} showLoadingSpinner={false} />
</div>

<div title={$t('group_places_by')}>
  <Select {options} bind:value={$placesViewSettings.groupBy} class="w-fit min-w-50" />
</div>

{#if $placesViewSettings.groupBy !== PlacesGroupBy.None}
  <span transition:slide={{ axis: 'x', duration: 250 }}>
    <!-- Expand Countries Groups -->
    <div class="hidden gap-0 xl:flex">
      <div class="block">
        <IconButton
          onclick={() => expandAllPlacesGroups()}
          variant="ghost"
          color="secondary"
          shape="round"
          icon={mdiUnfoldMoreHorizontal}
          aria-label={$t('expand_all')}
        />
      </div>

      <!-- Collapse Countries Groups -->
      <div class="block">
        <IconButton
          onclick={() => collapseAllPlacesGroups(placesGroups)}
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
