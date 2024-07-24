<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { SystemConfigTemplateStorageOptionDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  export let options: SystemConfigTemplateStorageOptionDto;

  const getLuxonExample = (format: string) => {
    return DateTime.fromISO('2022-09-04T20:03:05.250Z', { locale: $locale }).toFormat(format);
  };
</script>

<div class="mt-2 text-sm">
  <h4>{$t('date_and_time').toUpperCase()}</h4>
</div>

<div class="mt-2 rounded-lg bg-gray-200 p-4 text-xs dark:bg-gray-700 dark:text-immich-dark-fg">
  <div class="mb-2 text-gray-600 dark:text-immich-dark-fg">
    <p>{$t('admin.storage_template_date_time_description')}</p>
    <p>{$t('admin.storage_template_date_time_sample', { values: { date: '2022-02-03T04:56:05.250' } })}</p>
  </div>
  <div class="flex gap-[40px]">
    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('year').toUpperCase()}</p>
      <ul>
        {#each options.yearOptions as yearFormat}
          <li>{'{{'}{yearFormat}{'}}'} - {getLuxonExample(yearFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('month').toUpperCase()}</p>
      <ul>
        {#each options.monthOptions as monthFormat}
          <li>{'{{'}{monthFormat}{'}}'} - {getLuxonExample(monthFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('week').toUpperCase()}</p>
      <ul>
        {#each options.weekOptions as weekFormat}
          <li>{'{{'}{weekFormat}{'}}'} - {getLuxonExample(weekFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('day').toUpperCase()}</p>
      <ul>
        {#each options.dayOptions as dayFormat}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('hour').toUpperCase()}</p>
      <ul>
        {#each options.hourOptions as dayFormat}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('minute').toUpperCase()}</p>
      <ul>
        {#each options.minuteOptions as dayFormat}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('second').toUpperCase()}</p>
      <ul>
        {#each options.secondOptions as dayFormat}
          <li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>
