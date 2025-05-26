<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';
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

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="mt-4 ms-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.server_external_domain_settings')}
          description={$t('admin.server_external_domain_settings_description')}
          bind:value={config.server.externalDomain}
          isEdited={config.server.externalDomain !== savedConfig.server.externalDomain}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.server_welcome_message')}
          description={$t('admin.server_welcome_message_description')}
          bind:value={config.server.loginPageMessage}
          isEdited={config.server.loginPageMessage !== savedConfig.server.loginPageMessage}
        />

        <SettingSwitch
          title={$t('admin.server_public_users')}
          subtitle={$t('admin.server_public_users_description')}
          {disabled}
          bind:checked={config.server.publicUsers}
        />

        <div class="ms-4">
          <SettingButtonsRow
            onReset={(options) => onReset({ ...options, configKeys: ['server'] })}
            onSave={() => onSave({ server: config.server })}
            showResetToDefault={!isEqual(savedConfig.server, defaultConfig.server)}
            {disabled}
          />
        </div>
      </div>
    </form>
  </div>
</div>
