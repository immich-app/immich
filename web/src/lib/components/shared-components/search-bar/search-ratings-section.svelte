<script lang="ts">
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import Combobox from '../combobox.svelte';

  interface Props {
    rating?: number | null;
  }

  let { rating = $bindable() }: Props = $props();

  const options = [
    { value: 'null', label: $t('rating_count', { values: { count: 0 } }) },
    { value: '1', label: $t('rating_count', { values: { count: 1 } }) },
    { value: '2', label: $t('rating_count', { values: { count: 2 } }) },
    { value: '3', label: $t('rating_count', { values: { count: 3 } }) },
    { value: '4', label: $t('rating_count', { values: { count: 4 } }) },
    { value: '5', label: $t('rating_count', { values: { count: 5 } }) },
  ];
</script>

<div class="flex flex-col">
  <Text class="mb-2" fontWeight="medium">{$t('rating')}</Text>
  <Combobox
    label={$t('rating')}
    placeholder={$t('search_rating')}
    hideLabel
    {options}
    selectedOption={rating === undefined ? undefined : options[rating === null ? 0 : rating]}
    onSelect={(r) => (rating = r === undefined ? undefined : Number.parseInt(r.value))}
  />
</div>
