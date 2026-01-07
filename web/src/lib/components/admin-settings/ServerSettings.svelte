<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertToBytes } from '$lib/utils/byte-units';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const previousQuota = $state(config.server.storageQuotaSizeInGigabytes);

  const quotaSizeBytes = $derived(
    typeof configToEdit.server.storageQuotaSizeInGigabytes === 'number'
      ? convertToBytes(configToEdit.server.storageQuotaSizeInGigabytes, ByteUnit.GiB)
      : null,
  );

  let quotaSizeWarning = $derived(
    previousQuota !== configToEdit.server.storageQuotaSizeInGigabytes &&
      typeof configToEdit.server.storageQuotaSizeInGigabytes === 'number' &&
      configToEdit.server.storageQuotaSizeInGigabytes > 0 &&
      userInteraction.serverInfo &&
      quotaSizeBytes !== null &&
      quotaSizeBytes > userInteraction.serverInfo.diskSizeRaw,
  );
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

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('admin.server_storage_quota_gib')}
          description={$t('admin.server_storage_quota_gib_description')}
          bind:value={configToEdit.server.storageQuotaSizeInGigabytes}
          min={0}
          step="1"
          {disabled}
          isEdited={configToEdit.server.storageQuotaSizeInGigabytes !== config.server.storageQuotaSizeInGigabytes}
        />
        {#if quotaSizeWarning}
          <div class="ms-4 mt-2">
            <Text size="small" color="danger">{$t('errors.quota_higher_than_disk_size')}</Text>
          </div>
        {/if}

        <div class="ms-4">
          <SettingButtonsRow bind:configToEdit keys={['server']} {disabled} />
        </div>
      </div>
    </form>
  </div>
</div>
