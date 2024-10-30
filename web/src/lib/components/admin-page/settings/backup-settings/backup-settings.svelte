<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;

  $: cronExpressionOptions = [
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 02 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ];
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.backup_database_enable_description')}
          {disabled}
          bind:checked={config.backup.database.enabled}
        />

        <SettingSelect
          options={cronExpressionOptions}
          disabled={disabled || !config.backup.database.enabled}
          name="expression"
          label={$t('admin.cron_expression_presets')}
          bind:value={config.backup.database.cronExpression}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          required={true}
          disabled={disabled || !config.backup.database.enabled}
          label={$t('admin.cron_expression')}
          bind:value={config.backup.database.cronExpression}
          isEdited={config.backup.database.cronExpression !== savedConfig.backup.database.cronExpression}
        >
          <svelte:fragment slot="desc">
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.cron_expression_description" let:message>
                <a
                  href="https://crontab.guru/#{config.backup.database.cronExpression.replaceAll(' ', '_')}"
                  class="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {message}
                  <br />
                </a>
              </FormatMessage>
            </p>
          </svelte:fragment>
        </SettingInputField>

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          required={true}
          label={$t('admin.backup_keep_last_amount')}
          disabled={disabled || !config.backup.database.enabled}
          bind:value={config.backup.database.keepLastAmount}
          isEdited={config.backup.database.keepLastAmount !== savedConfig.backup.database.keepLastAmount}
        />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['backup'] })}
          onSave={() => onSave({ backup: config.backup })}
          showResetToDefault={!isEqual(savedConfig.backup, defaultConfig.backup)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
