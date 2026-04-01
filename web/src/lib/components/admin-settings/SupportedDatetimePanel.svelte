<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { SystemConfigTemplateStorageOptionDto } from '@immich/sdk';
  import { Card, CardBody, CardHeader, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    options: SystemConfigTemplateStorageOptionDto;
  }

  let { options }: Props = $props();

  const getExampleDate = () => DateTime.fromISO('2022-02-15T20:03:05.250Z', { locale: $locale });
</script>

{#snippet example(title: string, options: Array<string>)}
  <div>
    <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{title}</Text>
    <ul>
      {#each options as format, index (index)}
        <li>{`{{${format}}} - ${getExampleDate().toFormat(format)}`}</li>
      {/each}
    </ul>
  </div>
{/snippet}

<Text size="small">{$t('date_and_time')}</Text>

<Card class="mt-2 text-sm bg-light-50 shadow-none">
  <CardHeader>
    <Text class="mb-1">{$t('admin.storage_template_date_time_description')}</Text>
    <Text color="primary"
      >{$t('admin.storage_template_date_time_sample', { values: { date: getExampleDate().toISO() } })}</Text
    >
  </CardHeader>
  <CardBody>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4">
      {@render example($t('year'), options.yearOptions)}
      {@render example($t('month'), options.monthOptions)}
      {@render example($t('week'), options.weekOptions)}
      {@render example($t('day'), options.dayOptions)}
      {@render example($t('hour'), options.hourOptions)}
      {@render example($t('minute'), options.minuteOptions)}
      {@render example($t('second'), options.secondOptions)}
    </div>
  </CardBody>
</Card>
