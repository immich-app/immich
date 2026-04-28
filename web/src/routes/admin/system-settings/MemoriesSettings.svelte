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
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          min={0}
          label={$t('admin.memory_retention_setting')}
          description={$t('admin.memory_retention_setting_description')}
          bind:value={configToEdit.memories.retentionDays}
          required={true}
          {disabled}
          isEdited={configToEdit.memories.retentionDays !== config.memories.retentionDays}
        />
        <SettingSwitch
          title={$t('admin.birthday_memories_setting')}
          subtitle={$t('admin.birthday_memories_setting_description')}
          bind:checked={configToEdit.memories.birthday}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.recent_trip_memories_setting')}
          subtitle={$t('admin.recent_trip_memories_setting_description')}
          bind:checked={configToEdit.memories.recentTrips}
          {disabled}
        />

        <SettingButtonsRow bind:configToEdit keys={['memories']} {disabled} />
      </div>
    </form>
  </div>
</div>
