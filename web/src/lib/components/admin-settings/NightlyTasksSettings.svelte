<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from './admin-settings';

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

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit} class="mx-4 mt-4">
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('admin.nightly_tasks_start_time_setting')}
          description={$t('admin.nightly_tasks_start_time_setting_description')}
          bind:value={config.nightlyTasks.startTime}
          required={true}
          {disabled}
          isEdited={!(config.nightlyTasks.startTime === savedConfig.nightlyTasks.startTime)}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_database_cleanup_setting')}
          subtitle={$t('admin.nightly_tasks_database_cleanup_setting_description')}
          bind:checked={config.nightlyTasks.databaseCleanup}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_missing_thumbnails_setting')}
          subtitle={$t('admin.nightly_tasks_missing_thumbnails_setting_description')}
          bind:checked={config.nightlyTasks.missingThumbnails}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_cluster_new_faces_setting')}
          subtitle={$t('admin.nightly_tasks_cluster_faces_setting_description')}
          bind:checked={config.nightlyTasks.clusterNewFaces}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_generate_memories_setting')}
          subtitle={$t('admin.nightly_tasks_generate_memories_setting_description')}
          bind:checked={config.nightlyTasks.generateMemories}
          {disabled}
        />
        <SettingSwitch
          title={$t('admin.nightly_tasks_sync_quota_usage_setting')}
          subtitle={$t('admin.nightly_tasks_sync_quota_usage_setting_description')}
          bind:checked={config.nightlyTasks.syncQuotaUsage}
          {disabled}
        />
      </div>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['nightlyTasks'] })}
        onSave={() => onSave({ nightlyTasks: config.nightlyTasks })}
        showResetToDefault={!isEqual(savedConfig.nightlyTasks, defaultConfig.nightlyTasks)}
        {disabled}
      />
    </form>
  </div>
</div>
