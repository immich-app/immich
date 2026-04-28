<script lang="ts">
  import {
    buildFilterContext,
    type FilterPanelConfig,
    type FilterState,
  } from '$lib/components/filter-panel/filter-panel';

  interface Props {
    filters?: FilterState;
    config?: FilterPanelConfig;
    timeBuckets?: Array<{ timeBucket: string; count: number }>;
    [key: string]: unknown;
  }

  let { filters = $bindable(), config, timeBuckets = [], ...rest }: Props = $props();
  let suggestions = $state('');
  let requestToken = 0;

  function selectFavorites() {
    if (filters) {
      filters = { ...filters, isFavorite: true };
    }
  }

  function loadCitySuggestions() {
    if (filters) {
      void config?.providers?.cities?.('Germany', buildFilterContext(filters, ['country', 'city']));
    }
  }

  function loadCameraModelSuggestions() {
    if (filters) {
      void config?.providers?.cameraModels?.('Sony', buildFilterContext(filters, ['make', 'model']));
    }
  }

  $effect(() => {
    if (!config?.suggestionsProvider || !filters) {
      suggestions = '';
      return;
    }

    const token = ++requestToken;
    config
      .suggestionsProvider(filters)
      .then((result) => {
        if (token === requestToken) {
          suggestions = JSON.stringify(result);
        }
      })
      .catch(() => {
        if (token === requestToken) {
          suggestions = 'error';
        }
      });
  });
</script>

<div
  {...rest}
  data-testid="filter-panel-stub"
  data-has-filters={String(filters !== undefined)}
  data-sections={config?.sections.join(',') ?? ''}
  data-country={filters?.country ?? ''}
  data-is-favorite={String(filters?.isFavorite)}
  data-time-buckets={JSON.stringify(timeBuckets)}
  data-suggestions={suggestions}
>
  <button type="button" data-testid="select-favorites-filter" onclick={selectFavorites}>Favorites</button>
  <button type="button" data-testid="load-city-suggestions" onclick={loadCitySuggestions}>Load cities</button>
  <button type="button" data-testid="load-camera-model-suggestions" onclick={loadCameraModelSuggestions}>
    Load camera models
  </button>
  <button
    type="button"
    data-testid="filter-panel-set-country"
    onclick={() => {
      if (filters) {
        filters = { ...filters, country: 'Germany' };
      }
    }}
  >
    Set country
  </button>
  <button
    type="button"
    data-testid="filter-panel-set-sort-asc"
    onclick={() => {
      if (filters) {
        filters = { ...filters, sortOrder: 'asc' };
      }
    }}
  >
    Sort ascending
  </button>
</div>
