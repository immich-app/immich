<script lang="ts">
  import { t } from 'svelte-i18n';
  import Combobox from '../combobox.svelte';

  interface Props {
    rating?: number;
  }

  let { rating = $bindable() }: Props = $props();

  const options = [
    { value: '0', label: $t('rating_count', { values: { count: 0 } }) },
    { value: '1', label: $t('rating_count', { values: { count: 1 } }) },
    { value: '2', label: $t('rating_count', { values: { count: 2 } }) },
    { value: '3', label: $t('rating_count', { values: { count: 3 } }) },
    { value: '4', label: $t('rating_count', { values: { count: 4 } }) },
    { value: '5', label: $t('rating_count', { values: { count: 5 } }) },
  ];
</script>

<div class="grid grid-auto-fit-40 gap-5">
  <label class="immich-form-label" for="start-date">
    <Combobox
      label={$t('rating').toUpperCase()}
      placeholder={$t('search_rating')}
      {options}
      selectedOption={rating === undefined ? undefined : options[rating]}
      onSelect={(r) => (rating = r === undefined ? undefined : Number.parseInt(r.value))}
    />
  </label>
</div>
