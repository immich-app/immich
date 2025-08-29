<script lang="ts">
  import RadioButton from '$lib/components/elements/radio-button.svelte';
  import { AssetOrder } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    order?: AssetOrder;
    disabled?: boolean;
  }

  let { order = $bindable(), disabled = false }: Props = $props();

  $effect(() => {
    if (order === undefined) {
      order = AssetOrder.Desc;
    }
  });
</script>

<div id="sort-selection">
  <fieldset {disabled}>
    <legend class="immich-form-label {disabled ? 'opacity-50' : ''}">{$t('search_order').toUpperCase()}</legend>
    <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1 {disabled ? 'opacity-50' : ''}">
      {#if disabled}
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          {$t('sorted_by_relevance')}
        </div>
      {:else}
        <RadioButton
          name="sort-order"
          id="sort-desc"
          label={$t('newest_first')}
          bind:group={order}
          value={AssetOrder.Desc}
        />
        <RadioButton
          name="sort-order"
          id="sort-asc"
          label={$t('oldest_first')}
          bind:group={order}
          value={AssetOrder.Asc}
        />
      {/if}
    </div>
  </fieldset>
</div>
