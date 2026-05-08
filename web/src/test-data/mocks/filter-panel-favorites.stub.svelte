<script lang="ts">
  import {
    buildFilterContext,
    createFilterState,
    type FilterPanelConfig,
    type FilterState,
  } from '$lib/components/filter-panel/filter-panel';

  interface Props {
    filters?: FilterState;
    config?: FilterPanelConfig;
    [key: string]: unknown;
  }

  let { filters = $bindable(createFilterState()), config, ...rest }: Props = $props();

  function selectFavorites() {
    filters = { ...filters, isFavorite: true };
  }

  function selectHasNoAlbum() {
    filters = { ...filters, isNotInAlbum: true };
  }

  function loadCitySuggestions() {
    void config?.providers?.cities?.('Germany', buildFilterContext(filters, ['country', 'city']));
  }

  function loadCameraModelSuggestions() {
    void config?.providers?.cameraModels?.('Sony', buildFilterContext(filters, ['make', 'model']));
  }
</script>

<div
  {...rest}
  data-testid="filter-panel-stub"
  data-sections={config?.sections.join(',') ?? ''}
  data-is-favorite={String(filters?.isFavorite)}
  data-is-not-in-album={String(filters?.isNotInAlbum)}
>
  <button type="button" data-testid="select-favorites-filter" onclick={selectFavorites}>Favorites</button>
  <button type="button" data-testid="select-has-no-album-filter" onclick={selectHasNoAlbum}>Has no album</button>
  <button type="button" data-testid="load-city-suggestions" onclick={loadCitySuggestions}>Load cities</button>
  <button type="button" data-testid="load-camera-model-suggestions" onclick={loadCameraModelSuggestions}>
    Load camera models
  </button>
</div>
