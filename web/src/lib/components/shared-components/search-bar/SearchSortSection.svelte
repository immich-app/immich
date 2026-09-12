<script lang="ts">
  import SearchButton from './SearchButton.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { AssetOrder } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let order = $derived(searchManager.filter.order);

  const setOrder = (nextOrder: AssetOrder) => {
    searchManager.filter.order = order === nextOrder ? undefined : nextOrder;
  };
</script>

<section aria-label={$t('search_filter_display_options')}>
  <Text class="mb-5" fontWeight="medium">{$t('search_filter_display_options')}</Text>
  <div class="flex flex-wrap gap-2">
    <SearchButton checked active={order === AssetOrder.Desc} onclick={() => setOrder(AssetOrder.Desc)}>
      {$t('sort_recent')}
    </SearchButton>
    <SearchButton checked active={order === AssetOrder.Asc} onclick={() => setOrder(AssetOrder.Asc)}>
      {$t('sort_oldest')}
    </SearchButton>
  </div>
</section>
