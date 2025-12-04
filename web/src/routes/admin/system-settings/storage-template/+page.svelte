<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['user']}>
  {#snippet child({ disabled, config, configToEdit })}
    <SettingInputField
      inputType={SettingInputFieldType.NUMBER}
      min={1}
      label={$t('admin.user_delete_delay_settings')}
      description={$t('admin.user_delete_delay_settings_description')}
      bind:value={configToEdit.user.deleteDelay}
      {disabled}
      isEdited={configToEdit.user.deleteDelay !== config.user.deleteDelay}
    />
  {/snippet}
</SystemSettingsModal>
