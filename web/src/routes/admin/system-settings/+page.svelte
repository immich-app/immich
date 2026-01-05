<script lang="ts">
  import AuthSettings from '$lib/components/admin-settings/AuthSettings.svelte';
  import BackupSettings from '$lib/components/admin-settings/BackupSettings.svelte';
  import FFmpegSettings from '$lib/components/admin-settings/FFmpegSettings.svelte';
  import ImageSettings from '$lib/components/admin-settings/ImageSettings.svelte';
  import JobSettings from '$lib/components/admin-settings/JobSettings.svelte';
  import LibrarySettings from '$lib/components/admin-settings/LibrarySettings.svelte';
  import LoggingSettings from '$lib/components/admin-settings/LoggingSettings.svelte';
  import MachineLearningSettings from '$lib/components/admin-settings/MachineLearningSettings.svelte';
  import MaintenanceSettings from '$lib/components/admin-settings/MaintenanceSettings.svelte';
  import MapSettings from '$lib/components/admin-settings/MapSettings.svelte';
  import MetadataSettings from '$lib/components/admin-settings/MetadataSettings.svelte';
  import NewVersionCheckSettings from '$lib/components/admin-settings/NewVersionCheckSettings.svelte';
  import NightlyTasksSettings from '$lib/components/admin-settings/NightlyTasksSettings.svelte';
  import NotificationSettings from '$lib/components/admin-settings/NotificationSettings.svelte';
  import ServerSettings from '$lib/components/admin-settings/ServerSettings.svelte';
  import StorageTemplateSettings from '$lib/components/admin-settings/StorageTemplateSettings.svelte';
  import ThemeSettings from '$lib/components/admin-settings/ThemeSettings.svelte';
  import TrashSettings from '$lib/components/admin-settings/TrashSettings.svelte';
  import UserSettings from '$lib/components/admin-settings/UserSettings.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import SettingAccordionState from '$lib/components/shared-components/settings/setting-accordion-state.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { QueryParameter } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { getSystemConfigActions } from '$lib/services/system-config.service';
  import { Alert, CommandPaletteContext, Container } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiBackupRestore,
    mdiBellOutline,
    mdiBookshelf,
    mdiClockOutline,
    mdiDatabaseOutline,
    mdiFileDocumentOutline,
    mdiFolderOutline,
    mdiImageOutline,
    mdiLockOutline,
    mdiMapMarkerOutline,
    mdiPaletteOutline,
    mdiRestore,
    mdiRobotOutline,
    mdiServerOutline,
    mdiSync,
    mdiTrashCanOutline,
    mdiUpdate,
    mdiVideoOutline,
  } from '@mdi/js';
  import type { Component } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const settings: Array<{
    component: Component;
    title: string;
    subtitle: string;
    key: string;
    icon: string;
  }> = [
    {
      component: AuthSettings,
      title: $t('admin.authentication_settings'),
      subtitle: $t('admin.authentication_settings_description'),
      key: 'authentication',
      icon: mdiLockOutline,
    },
    {
      component: BackupSettings,
      title: $t('admin.backup_settings'),
      subtitle: $t('admin.backup_settings_description'),
      key: 'backup',
      icon: mdiBackupRestore,
    },
    {
      component: ImageSettings,
      title: $t('admin.image_settings'),
      subtitle: $t('admin.image_settings_description'),
      key: 'image',
      icon: mdiImageOutline,
    },
    {
      component: JobSettings,
      title: $t('admin.job_settings'),
      subtitle: $t('admin.job_settings_description'),
      key: 'job',
      icon: mdiSync,
    },
    {
      component: LibrarySettings,
      title: $t('admin.library_settings'),
      subtitle: $t('admin.library_settings_description'),
      key: 'external-library',
      icon: mdiBookshelf,
    },
    {
      component: LoggingSettings,
      title: $t('admin.logging_settings'),
      subtitle: $t('admin.manage_log_settings'),
      key: 'logging',
      icon: mdiFileDocumentOutline,
    },
    {
      component: MachineLearningSettings,
      title: $t('admin.machine_learning_settings'),
      subtitle: $t('admin.machine_learning_settings_description'),
      key: 'machine-learning',
      icon: mdiRobotOutline,
    },
    {
      component: MaintenanceSettings,
      title: $t('admin.maintenance_settings'),
      subtitle: $t('admin.maintenance_settings_description'),
      key: 'maintenance',
      icon: mdiRestore,
    },
    {
      component: MapSettings,
      title: $t('admin.map_gps_settings'),
      subtitle: $t('admin.map_gps_settings_description'),
      key: 'location',
      icon: mdiMapMarkerOutline,
    },
    {
      component: MetadataSettings,
      title: $t('admin.metadata_settings'),
      subtitle: $t('admin.metadata_settings_description'),
      key: 'metadata',
      icon: mdiDatabaseOutline,
    },
    {
      component: NightlyTasksSettings,
      title: $t('admin.nightly_tasks_settings'),
      subtitle: $t('admin.nightly_tasks_settings_description'),
      key: 'nightly-tasks',
      icon: mdiClockOutline,
    },
    {
      component: NotificationSettings,
      title: $t('admin.notification_settings'),
      subtitle: $t('admin.notification_settings_description'),
      key: 'notifications',
      icon: mdiBellOutline,
    },
    {
      component: ServerSettings,
      title: $t('admin.server_settings'),
      subtitle: $t('admin.server_settings_description'),
      key: 'server',
      icon: mdiServerOutline,
    },
    {
      component: StorageTemplateSettings,
      title: $t('admin.storage_template_settings'),
      subtitle: $t('admin.storage_template_settings_description'),
      key: 'storage-template',
      icon: mdiFolderOutline,
    },
    {
      component: ThemeSettings,
      title: $t('admin.theme_settings'),
      subtitle: $t('admin.theme_settings_description'),
      key: 'theme',
      icon: mdiPaletteOutline,
    },
    {
      component: TrashSettings,
      title: $t('admin.trash_settings'),
      subtitle: $t('admin.trash_settings_description'),
      key: 'trash',
      icon: mdiTrashCanOutline,
    },
    {
      component: UserSettings,
      title: $t('admin.user_settings'),
      subtitle: $t('admin.user_settings_description'),
      key: 'user-settings',
      icon: mdiAccountOutline,
    },
    {
      component: NewVersionCheckSettings,
      title: $t('admin.version_check_settings'),
      subtitle: $t('admin.version_check_settings_description'),
      key: 'version-check',
      icon: mdiUpdate,
    },
    {
      component: FFmpegSettings,
      title: $t('admin.transcoding_settings'),
      subtitle: $t('admin.transcoding_settings_description'),
      key: 'video-transcoding',
      icon: mdiVideoOutline,
    },
  ];

  let searchQuery = $state('');

  let filteredSettings = $derived(
    settings.filter(({ title, subtitle }) => {
      const query = searchQuery.toLowerCase();
      return title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query);
    }),
  );

  const { CopyToClipboard, Upload, Download } = $derived(
    getSystemConfigActions($t, featureFlagsManager.value, systemConfigManager.value),
  );
</script>

<CommandPaletteContext commands={[CopyToClipboard, Upload, Download]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[CopyToClipboard, Download, Upload]}>
  <Container size="large" center>
    {#if featureFlagsManager.value.configFile}
      <Alert color="warning" class="text-dark my-4" title={$t('admin.config_set_by_file')} />
    {/if}
    <div>
      <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
    </div>
    <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
      {#each filteredSettings as { component: Component, title, subtitle, key, icon } (key)}
        <SettingAccordion {title} {subtitle} {key} {icon}>
          <Component />
        </SettingAccordion>
      {/each}
    </SettingAccordionState>
  </Container>
</AdminPageLayout>
