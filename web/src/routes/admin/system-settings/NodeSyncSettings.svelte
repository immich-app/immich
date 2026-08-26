<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <Text size="small" color="secondary">{$t('admin.node_sync_settings_description')}</Text>

        <SettingSwitch
          title={$t('admin.node_sync_enabled')}
          subtitle={$t('admin.node_sync_enabled_description')}
          {disabled}
          bind:checked={configToEdit.nodeSync.enabled}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.node_sync_cron_expression')}
          description={$t('admin.node_sync_cron_expression_description')}
          disabled={disabled || !configToEdit.nodeSync.enabled}
          bind:value={configToEdit.nodeSync.cronExpression}
          isEdited={configToEdit.nodeSync.cronExpression !== config.nodeSync.cronExpression}
        />

        <SettingButtonsRow bind:configToEdit keys={['nodeSync']} {disabled} />
      </div>
    </form>
  </div>
</div>
