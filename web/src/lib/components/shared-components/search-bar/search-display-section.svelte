<script lang="ts" module>
  export interface SearchDisplayFilters {
    isNotInAlbum: boolean;
    isArchive: boolean;
    isFavorite: boolean;
  }
</script>

<script lang="ts">
  import { Checkbox, Label } from '@immich/ui';

  import { t } from 'svelte-i18n';
  import type { SvelteSet } from 'svelte/reactivity';

  interface Props {
    filters: SearchDisplayFilters;
    selectedAlbums: SvelteSet<string>;
  }

  let { filters = $bindable(), selectedAlbums }: Props = $props();

  //disable the filter if albums get selected
  $effect(() => {
    if (selectedAlbums?.size > 0) {
      filters.isNotInAlbum = false;
    }
  });
</script>

<div id="display-options-selection">
  <fieldset>
    <legend class="immich-form-label">{$t('display_options').toUpperCase()}</legend>
    <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1">
      <div class="flex items-center gap-2">
        <Checkbox
          disabled={selectedAlbums?.size > 0}
          id="not-in-album-checkbox"
          size="tiny"
          bind:checked={filters.isNotInAlbum}
        />
        <Label label={$t('not_in_any_album')} for="not-in-album-checkbox" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="archive-checkbox" size="tiny" bind:checked={filters.isArchive} />
        <Label label={$t('archive')} for="archive-checkbox" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="favorites-checkbox" size="tiny" bind:checked={filters.isFavorite} />
        <Label label={$t('favorites')} for="favorites-checkbox" />
      </div>
    </div>
  </fieldset>
</div>
