<script lang="ts">
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import { AssetSortBy, SortOrder, searchViewSettings } from '$lib/stores/preferences.store';
  import { mdiArrowDownThin, mdiArrowUpThin } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const sortOptionsMetadata: Record<AssetSortBy, { id: AssetSortBy; defaultOrder: SortOrder }> = {
    [AssetSortBy.FileSize]: {
      id: AssetSortBy.FileSize,
      defaultOrder: SortOrder.Desc,
    },
    [AssetSortBy.DateCreated]: {
      id: AssetSortBy.DateCreated,
      defaultOrder: SortOrder.Desc,
    },
    [AssetSortBy.Duration]: {
      id: AssetSortBy.Duration,
      defaultOrder: SortOrder.Desc,
    },
  };

  let { onSortChange = null } = $props();

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const findSortOptionMetadata = (sortBy: string) => {
    return sortOptionsMetadata[sortBy as AssetSortBy];
  };

  const handleChangeSortBy = ({ id, defaultOrder }: { id: AssetSortBy; defaultOrder: SortOrder }) => {
    searchViewSettings.update((settings) => {
      return settings.sortBy === id
        ? {
            ...settings,
            sortOrder: flipOrdering(settings.sortOrder),
          }
        : {
            ...settings,
            sortBy: id,
            sortOrder: defaultOrder,
          };
    });
  };

  if (onSortChange) {
    const currentSettings = $searchViewSettings;
    onSortChange(currentSettings.sortBy, currentSettings.sortOrder);
  }

  let selectedSortOption = $derived(findSortOptionMetadata($searchViewSettings.sortBy));
  let sortIcon = $derived($searchViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin);
  let assetSortByNames = $derived({
    [AssetSortBy.FileSize]: $t('sort_file_size'),
    [AssetSortBy.DateCreated]: $t('sort_created'),
    [AssetSortBy.Duration]: $t('sort_duration'),
  });
</script>

<!-- Sort Assets Dropdown -->
<Dropdown
  title={$t('sort_assets_by')}
  options={Object.values(sortOptionsMetadata)}
  selectedOption={selectedSortOption}
  onSelect={handleChangeSortBy}
  render={({ id }) => ({
    title: assetSortByNames[id],
    icon: sortIcon,
  })}
/>
