<script lang="ts">
  import { getSearchTypeTitle } from './search-bar-utils';
  import SearchButton from './SearchButton.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let queryType = $derived(searchManager.filter.queryType);

  const setType = (type: 'smart' | 'metadata' | 'description' | 'fullPath' | 'ocr') => {
    searchManager.filter.queryType = type;
  };
</script>

<section>
  <fieldset>
    <Text class="mb-5">{$t('search_type_description')}</Text>
    <div class="flex flex-wrap gap-2">
      {#if featureFlagsManager.value.smartSearch}
        <SearchButton checked active={queryType === 'smart'} onclick={() => setType('smart')}>
          {$t('context')}
        </SearchButton>
      {/if}
      <SearchButton checked active={queryType === 'metadata'} onclick={() => setType('metadata')}>
        {getSearchTypeTitle('metadata')}
      </SearchButton>
      <SearchButton checked active={queryType === 'description'} onclick={() => setType('description')}>
        {getSearchTypeTitle('description')}
      </SearchButton>
      <SearchButton checked active={queryType === 'fullPath'} onclick={() => setType('fullPath')}>
        {getSearchTypeTitle('fullPath')}
      </SearchButton>
      {#if featureFlagsManager.value.ocr}
        <SearchButton checked active={queryType === 'ocr'} onclick={() => setType('ocr')}>
          {getSearchTypeTitle('ocr')}
        </SearchButton>
      {/if}
    </div>
  </fieldset>
</section>
