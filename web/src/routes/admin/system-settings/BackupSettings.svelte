<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSelect from './SettingSelect.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Link } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

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
          key="backup.database.enabled"
          bind:checked={configToEdit.backup.database.enabled}
        />

        <SettingSelect
          options={cronExpressionOptions}
          disabled={!configToEdit.backup.database.enabled}
          name="expression"
          label={$t('admin.cron_expression_presets')}
          key="backup.database.cronExpression"
          bind:value={configToEdit.backup.database.cronExpression}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          required={true}
          disabled={!configToEdit.backup.database.enabled}
          label={$t('admin.cron_expression')}
          key="backup.database.cronExpression"
          bind:value={configToEdit.backup.database.cronExpression}
          isEdited={configToEdit.backup.database.cronExpression !== config.backup.database.cronExpression}
        >
          {#snippet descriptionSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.cron_expression_description">
                {#snippet children({ message })}
                  <Link href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}">
                    {message}
                    <br />
                  </Link>
                {/snippet}
              </FormatMessage>
            </p>
          {/snippet}
        </SettingInputField>

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          required={true}
          label={$t('admin.backup_keep_last_amount')}
          disabled={!configToEdit.backup.database.enabled}
          key="backup.database.keepLastAmount"
          bind:value={configToEdit.backup.database.keepLastAmount}
          isEdited={configToEdit.backup.database.keepLastAmount !== config.backup.database.keepLastAmount}
        />

        <SettingButtonsRow bind:configToEdit keys={['backup']} />
      </div>
    </form>
  </div>
</div>
