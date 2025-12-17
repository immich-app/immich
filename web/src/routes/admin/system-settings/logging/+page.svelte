<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { LogLevel } from '@immich/sdk';
  import { Field, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['logging']}>
  {#snippet child({ disabled, config, configToEdit })}
    <Field required {disabled} label={$t('admin.logging_enable_description')}>
      <Switch bind:checked={configToEdit.logging.enabled} />
    </Field>

    <SettingSelect
      label={$t('level')}
      desc={$t('admin.logging_level_description')}
      bind:value={configToEdit.logging.level}
      options={[
        { value: LogLevel.Fatal, text: 'Fatal' },
        { value: LogLevel.Error, text: 'Error' },
        { value: LogLevel.Warn, text: 'Warn' },
        { value: LogLevel.Log, text: 'Log' },
        { value: LogLevel.Debug, text: 'Debug' },
        { value: LogLevel.Verbose, text: 'Verbose' },
      ]}
      name="level"
      isEdited={configToEdit.logging.level !== config.logging.level}
      disabled={disabled || !configToEdit.logging.enabled}
    />
  {/snippet}
</SystemSettingsModal>
