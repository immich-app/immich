<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import { SettingInputFieldType } from '$lib/constants';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  let cronExpressionOptions = $derived([
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 02 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ]);

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
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
          {#snippet descriptionSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.cron_expression_description">
                {#snippet children({ message })}
                  <a
                    href="https://crontab.guru/#{config.backup.database.cronExpression.replaceAll(' ', '_')}"
                    class="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {message}
                    <br />
                  </a>
                {/snippet}
              </FormatMessage>
            </p>
          {/snippet}
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
