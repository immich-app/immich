<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['server']}>
  {#snippet child({ disabled, config, configToEdit })}
    <SettingInputField
      inputType={SettingInputFieldType.TEXT}
      label={$t('admin.server_external_domain_settings')}
      description={$t('admin.server_external_domain_settings_description')}
      bind:value={configToEdit.server.externalDomain}
      isEdited={configToEdit.server.externalDomain !== config.server.externalDomain}
    />

    <SettingInputField
      inputType={SettingInputFieldType.TEXT}
      label={$t('admin.server_welcome_message')}
      description={$t('admin.server_welcome_message_description')}
      bind:value={configToEdit.server.loginPageMessage}
      isEdited={configToEdit.server.loginPageMessage !== config.server.loginPageMessage}
    />

    <SettingSwitch
      title={$t('admin.server_public_users')}
      subtitle={$t('admin.server_public_users_description')}
      {disabled}
      bind:checked={configToEdit.server.publicUsers}
    />
  {/snippet}
</SystemSettingsModal>
