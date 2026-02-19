import type { EditActions, EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import { EditFilter, filters } from '$lib/utils/filters';
import { AssetEditAction, type AssetEditActionFilter, type AssetResponseDto, type FilterParameters } from '@immich/sdk';

class FilterManager implements EditToolManager {
  selectedFilter: EditFilter = $state(filters[0]);
  canReset: boolean = $derived(!this.selectedFilter.isIdentity);

  hasChanges = $derived(!this.selectedFilter.isIdentity);
  edits = $derived<EditActions>(
    this.hasChanges
      ? [
          {
            action: AssetEditAction.Filter,
            parameters: this.selectedFilter.dtoParameters,
          } as AssetEditActionFilter,
        ]
      : [],
  );

  resetAllChanges() {
    this.selectedFilter = filters[0];
  }

  onActivate(asset: AssetResponseDto, edits: EditActions) {
    const filterEdits = edits.filter((edit) => edit.action === AssetEditAction.Filter);
    if (filterEdits.length > 0) {
      const dtoFilter = EditFilter.fromDto(filterEdits[0].parameters as FilterParameters, 'Custom');
      this.selectedFilter = filters.find((filter) => filter.equals(dtoFilter)) ?? filters[0];
    }
  }

  onDeactivate() {
    this.resetAllChanges();
  }

  selectFilter(filter: EditFilter) {
    this.selectedFilter = filter;
    console.log('Selected filter:', filter);
  }
}

export const filterManager = new FilterManager();
