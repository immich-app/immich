<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;

  $: cronExpressionOptions = [
    { title: $t('interval.night_at_midnight'), expression: '0 0 * * *' },
    { title: $t('interval.night_at_twoam'), expression: '0 2 * * *' },
    { title: $t('interval.day_at_onepm'), expression: '0 13 * * *' },
    { title: $t('interval.hours', { values: { hours: 6 } }), expression: '0 */6 * * *' },
  ];
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingAccordion
          key="library-watching"
          title={$t('admin.library_watching_settings')}
          subtitle={$t('admin.library_watching_settings_description')}
          isOpen
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_watching_enable_description')}
              {disabled}
              bind:checked={config.library.watch.enabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="library-scanning"
          title={$t('admin.library_scanning')}
          subtitle={$t('admin.library_scanning_description')}
          isOpen
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_scanning_enable_description')}
              {disabled}
              bind:checked={config.library.scan.enabled}
            />

            <div class="flex flex-col my-2 dark:text-immich-dark-fg">
              <label
                class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm"
                for="expression-select"
              >
                {$t('admin.library_cron_expression_presets')}
              </label>
              <select
                class="p-2 mt-2 text-sm rounded-lg bg-slate-200 hover:cursor-pointer dark:bg-gray-600"
                disabled={disabled || !config.library.scan.enabled}
                name="expression"
                id="expression-select"
                bind:value={config.library.scan.cronExpression}
              >
                {#each cronExpressionOptions as { title, expression }}
                  <option value={expression}>{title}</option>
                {/each}
              </select>
            </div>

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled || !config.library.scan.enabled}
              label={$t('admin.library_cron_expression')}
              bind:value={config.library.scan.cronExpression}
              isEdited={config.library.scan.cronExpression !== savedConfig.library.scan.cronExpression}
            >
              <svelte:fragment slot="desc">
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.library_cron_expression_description" let:message>
                    <a href="https://crontab.guru" class="underline" target="_blank" rel="noreferrer">
                      {message}
                    </a>
                  </FormatMessage>
                </p>
              </svelte:fragment>
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['library'] })}
          onSave={() => onSave({ library: config.library })}
          showResetToDefault={!isEqual(savedConfig.library, defaultConfig.library)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
