<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="mt-4 ms-4">
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

        <div class="ms-4">
          <SettingButtonsRow bind:configToEdit keys={['server']} {disabled} />
        </div>
      </div>
    </form>
  </div>
</div>
