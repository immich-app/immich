<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  let cronExpressionOptions = $derived([
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 02 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ]);
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.backup_database_enable_description')}
          {disabled}
          bind:checked={configToEdit.backup.database.enabled}
        />

        <SettingSelect
          options={cronExpressionOptions}
          disabled={disabled || !configToEdit.backup.database.enabled}
          name="expression"
          label={$t('admin.cron_expression_presets')}
          bind:value={configToEdit.backup.database.cronExpression}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          required={true}
          disabled={disabled || !configToEdit.backup.database.enabled}
          label={$t('admin.cron_expression')}
          bind:value={configToEdit.backup.database.cronExpression}
          isEdited={configToEdit.backup.database.cronExpression !== config.backup.database.cronExpression}
        >
          {#snippet descriptionSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.cron_expression_description">
                {#snippet children({ message })}
                  <a
                    href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}"
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
          disabled={disabled || !configToEdit.backup.database.enabled}
          bind:value={configToEdit.backup.database.keepLastAmount}
          isEdited={configToEdit.backup.database.keepLastAmount !== config.backup.database.keepLastAmount}
        />

        <SettingButtonsRow {disabled} bind:configToEdit keys={['backup']} />
      </div>
    </form>
  </div>
</div>
