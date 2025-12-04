<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['trash']}>
  {#snippet child({ disabled, config, configToEdit })}
    <div class="flex flex-col gap-4">
      <SettingSwitch
        title={$t('admin.trash_enabled_description')}
        {disabled}
        bind:checked={configToEdit.trash.enabled}
      />

      <SettingInputField
        inputType={SettingInputFieldType.NUMBER}
        label={$t('admin.trash_number_of_days')}
        description={$t('admin.trash_number_of_days_description')}
        bind:value={configToEdit.trash.days}
        required={true}
        disabled={disabled || !configToEdit.trash.enabled}
        isEdited={configToEdit.trash.days !== config.trash.days}
      />
    </div>
  {/snippet}
</SystemSettingsModal>
