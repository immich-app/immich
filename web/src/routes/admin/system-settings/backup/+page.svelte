<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { Field, HelperText, Input, Link, NumberInput, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let cronExpressionOptions = $derived([
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 02 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ]);
</script>

<SystemSettingsModal keys={['backup']}>
  {#snippet child({ disabled, configToEdit })}
    <Field label={$t('admin.backup_database_enable_description')} {disabled}>
      <Switch bind:checked={configToEdit.backup.database.enabled} />
    </Field>

    <SettingSelect
      options={cronExpressionOptions}
      disabled={disabled || !configToEdit.backup.database.enabled}
      name="expression"
      label={$t('admin.cron_expression_presets')}
      bind:value={configToEdit.backup.database.cronExpression}
    />

    <Field label={$t('admin.cron_expression')} required disabled={disabled || !configToEdit.backup.database.enabled}>
      <Input bind:value={configToEdit.backup.database.cronExpression} />
      <HelperText>
        <FormatMessage key="admin.cron_expression_description">
          {#snippet children({ message })}
            <Link href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}">
              {message}
            </Link>
          {/snippet}
        </FormatMessage>
      </HelperText>
    </Field>

    <Field
      required
      label={$t('admin.backup_keep_last_amount')}
      disabled={disabled || !configToEdit.backup.database.enabled}
    >
      <NumberInput bind:value={configToEdit.backup.database.keepLastAmount}></NumberInput>
    </Field>
  {/snippet}
</SystemSettingsModal>
