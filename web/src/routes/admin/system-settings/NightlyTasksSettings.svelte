<script lang="ts">
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '#lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(getAdminConfigQuery);
  const config = $derived(query.data);

  let configToEdit = $state(cloneDeep(config));
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" class="mx-4 mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.nightly_tasks_start_time_setting')}
          description={$t('admin.nightly_tasks_start_time_setting_description')}
          key="nightlyTasks.startTime"
          bind:value={configToEdit.nightlyTasks.startTime}
          required={true}
          isEdited={configToEdit.nightlyTasks.startTime !== config.nightlyTasks.startTime}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_database_cleanup_setting')}
          subtitle={$t('admin.nightly_tasks_database_cleanup_setting_description')}
          key="nightlyTasks.databaseCleanup"
          bind:checked={configToEdit.nightlyTasks.databaseCleanup}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_missing_thumbnails_setting')}
          subtitle={$t('admin.nightly_tasks_missing_thumbnails_setting_description')}
          key="nightlyTasks.missingThumbnails"
          bind:checked={configToEdit.nightlyTasks.missingThumbnails}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_cluster_new_faces_setting')}
          subtitle={$t('admin.nightly_tasks_cluster_faces_setting_description')}
          key="nightlyTasks.clusterNewFaces"
          bind:checked={configToEdit.nightlyTasks.clusterNewFaces}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_generate_memories_setting')}
          subtitle={$t('admin.nightly_tasks_generate_memories_setting_description')}
          key="nightlyTasks.generateMemories"
          bind:checked={configToEdit.nightlyTasks.generateMemories}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_sync_quota_usage_setting')}
          subtitle={$t('admin.nightly_tasks_sync_quota_usage_setting_description')}
          key="nightlyTasks.syncQuotaUsage"
          bind:checked={configToEdit.nightlyTasks.syncQuotaUsage}
        />
      </div>

      <SettingButtonsRow bind:configToEdit keys={['nightlyTasks']} />
    </form>
  </div>
</div>
