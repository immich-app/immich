<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { SystemConfigTemplateStorageOptionDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    options: SystemConfigTemplateStorageOptionDto;
  }

  let { options }: Props = $props();

  const getLuxonExample = (format: string) => {
    return DateTime.fromISO('2022-09-04T20:03:05.250Z', { locale: $locale }).toFormat(format);
  };
</script>

<div class="mt-2 text-sm">
  <h4 class="uppercase">{$t('date_and_time')}</h4>
</div>

<!-- eslint-disable svelte/no-useless-mustaches -->
<div class="mt-2 rounded-lg bg-gray-200 p-4 text-xs dark:bg-gray-700 dark:text-immich-dark-fg">
  <div class="mb-2 text-gray-600 dark:text-immich-dark-fg">
    <p>{$t('admin.storage_template_date_time_description')}</p>
    <p>{$t('admin.storage_template_date_time_sample', { values: { date: '2022-09-04T20:03:05.250' } })}</p>
  </div>
  <div class="flex gap-[40px]">
    <div>
      <p class="uppercase font-medium text-primary">{$t('year')}</p>
      <ul>
        {#each options.yearOptions as yearFormat, index (index)}
          <li>{'{{'}{yearFormat}{'}}'} - {getLuxonExample(yearFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('month')}</p>
      <ul>
        {#each options.monthOptions as monthFormat, index (index)}
          <li>{'{{'}{monthFormat}{'}}'} - {getLuxonExample(monthFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('week')}</p>
      <ul>
        {#each options.weekOptions as weekFormat, index (index)}
          <li>{'{{'}{weekFormat}{'}}'} - {getLuxonExample(weekFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('day')}</p>
      <ul>
        {#each options.dayOptions as dayFormat, index (index)}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('hour')}</p>
      <ul>
        {#each options.hourOptions as dayFormat, index (index)}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('minute')}</p>
      <ul>
        {#each options.minuteOptions as dayFormat, index (index)}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="uppercase font-medium text-primary">{$t('second')}</p>
      <ul>
        {#each options.secondOptions as dayFormat, index (index)}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>
