<script lang="ts">
  import SearchButton from './SearchButton.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { AssetOrder } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let filters = $derived(searchManager.filter.display);
  let queryType = $derived(searchManager.filter.queryType);
</script>

<div id="display-options-selection">
  <fieldset>
    <Text class="py-5" fontWeight="medium">{$t('library')}</Text>
    <div class="flex flex-wrap gap-2">
      <SearchButton checked active={filters.isFavorite} onclick={() => (filters.isFavorite = !filters.isFavorite)}
        >{$t('favorites')}</SearchButton
      >
      <SearchButton checked active={filters.isArchive} onclick={() => (filters.isArchive = !filters.isArchive)}
        >{$t('archive')}</SearchButton
      >
      <SearchButton checked active={filters.isNotInAlbum} onclick={() => (filters.isNotInAlbum = !filters.isNotInAlbum)}
        >{$t('search_filter_display_option_not_in_album')}</SearchButton
      >
    </div>
  </fieldset>

  {#if queryType === 'smart'}
    <fieldset>
      <Text class="py-5" fontWeight="medium">{$t('search_filter_display_options')}</Text>
      <div class="flex flex-wrap gap-2">
        <SearchButton
          checked
          active={searchManager.filter.order === AssetOrder.Desc}
          onclick={() => {
            searchManager.filter.order =
              searchManager.filter.order === AssetOrder.Desc ? undefined : AssetOrder.Desc;
          }}>{$t('newest_first')}</SearchButton
        >
      </div>
    </fieldset>
  {/if}
</div>
