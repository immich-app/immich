<script lang="ts">
  import RadioButton from '$lib/elements/RadioButton.svelte';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    sortOrder: 'best-match' | 'newest' | 'oldest';
  }

  let { sortOrder = $bindable() }: Props = $props();
</script>

<div id="sort-order-selection">
  <fieldset>
    <Text class="mb-2" fontWeight="medium">{$t('sort_order')}</Text>

    <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1">
      <RadioButton
        name="sort-order"
        id="sort-best-match"
        bind:group={sortOrder}
        label={$t('best_match')}
        value="best-match"
      />
      <RadioButton
        name="sort-order"
        id="sort-newest"
        bind:group={sortOrder}
        label={$t('newest_first')}
        value="newest"
      />
      <RadioButton
        name="sort-order"
        id="sort-oldest"
        bind:group={sortOrder}
        label={$t('oldest_first')}
        value="oldest"
      />
    </div>
  </fieldset>
</div>
