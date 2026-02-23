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

  const getLuxonExample = (format: string) => {
    return DateTime.fromISO('2022-02-15T20:03:05.250Z', { locale: $locale }).toFormat(format);
  };
</script>

<Text size="small">{$t('date_and_time')}</Text>

<!-- eslint-disable svelte/no-useless-mustaches -->
<Card class="mt-2 text-sm bg-light-50 shadow-none">
  <CardHeader>
    <Text class="mb-1">{$t('admin.storage_template_date_time_description')}</Text>
    <Text color="primary"
      >{$t('admin.storage_template_date_time_sample', { values: { date: '2022-02-15T20:03:05.250+00:00' } })}</Text
    >
  </CardHeader>
  <CardBody>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4">
      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('year')}</Text>
        <ul>
          {#each options.yearOptions as yearFormat, index (index)}
            <li>{'{{'}{yearFormat}{'}}'} - {getLuxonExample(yearFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('month')}</Text>
        <ul>
          {#each options.monthOptions as monthFormat, index (index)}
            <li>{'{{'}{monthFormat}{'}}'} - {getLuxonExample(monthFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('week')}</Text>
        <ul>
          {#each options.weekOptions as weekFormat, index (index)}
            <li>{'{{'}{weekFormat}{'}}'} - {getLuxonExample(weekFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('day')}</Text>
        <ul>
          {#each options.dayOptions as dayFormat, index (index)}
            <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('hour')}</Text>
        <ul>
          {#each options.hourOptions as dayFormat, index (index)}
            <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('minute')}</Text>
        <ul>
          {#each options.minuteOptions as dayFormat, index (index)}
            <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
          {/each}
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('second')}</Text>
        <ul>
          {#each options.secondOptions as dayFormat, index (index)}
            <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
          {/each}
        </ul>
      </div>
    </div>
  </CardBody>
</Card>
