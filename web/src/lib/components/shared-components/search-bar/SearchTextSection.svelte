<script lang="ts">
  import { searchManager } from '#lib/managers/search-manager.svelte.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import SearchButton from './SearchButton.svelte';
  import { getSearchTypeTitle } from './search-bar-utils';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

  let queryType = $derived(searchManager.filter.queryType);

  const setType = (type: 'smart' | 'metadata' | 'description' | 'fullPath' | 'ocr') => {
    searchManager.setQueryType(type);
  };
</script>

<section>
  <fieldset>
    <Text class="mb-5">{$t('search_type_description')}</Text>
    <div class="flex flex-wrap gap-2">
      {#if config.machineLearning.clip.enabled}
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
      {#if config.machineLearning.ocr.enabled}
        <SearchButton checked active={queryType === 'ocr'} onclick={() => setType('ocr')}>
          {getSearchTypeTitle('ocr')}
        </SearchButton>
      {/if}
    </div>
  </fieldset>
</section>
