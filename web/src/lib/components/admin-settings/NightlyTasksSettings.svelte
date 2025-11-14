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

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" class="mx-4 mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.nightly_tasks_start_time_setting')}
          description={$t('admin.nightly_tasks_start_time_setting_description')}
          bind:value={configToEdit.nightlyTasks.startTime}
          required={true}
          {disabled}
          isEdited={!(configToEdit.nightlyTasks.startTime === config.nightlyTasks.startTime)}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_database_cleanup_setting')}
          subtitle={$t('admin.nightly_tasks_database_cleanup_setting_description')}
          bind:checked={configToEdit.nightlyTasks.databaseCleanup}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_missing_thumbnails_setting')}
          subtitle={$t('admin.nightly_tasks_missing_thumbnails_setting_description')}
          bind:checked={configToEdit.nightlyTasks.missingThumbnails}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_cluster_new_faces_setting')}
          subtitle={$t('admin.nightly_tasks_cluster_faces_setting_description')}
          bind:checked={configToEdit.nightlyTasks.clusterNewFaces}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_generate_memories_setting')}
          subtitle={$t('admin.nightly_tasks_generate_memories_setting_description')}
          bind:checked={configToEdit.nightlyTasks.generateMemories}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_sync_quota_usage_setting')}
          subtitle={$t('admin.nightly_tasks_sync_quota_usage_setting_description')}
          bind:checked={configToEdit.nightlyTasks.syncQuotaUsage}
          {disabled}
        />
      </div>

      <SettingButtonsRow bind:configToEdit keys={['nightlyTasks']} {disabled} />
    </form>
  </div>
</div>
