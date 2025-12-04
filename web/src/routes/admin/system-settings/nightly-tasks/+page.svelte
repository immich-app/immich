<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['nightlyTasks']}>
  {#snippet child({ disabled, config, configToEdit })}
    <div class="flex flex-col gap-4">
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
  {/snippet}
</SystemSettingsModal>
