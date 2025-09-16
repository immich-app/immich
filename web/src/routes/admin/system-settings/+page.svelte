<script lang="ts">
  import type { SettingsComponentProps } from '$lib/components/admin-settings/admin-settings';
  import AdminSettings from '$lib/components/admin-settings/AdminSettings.svelte';
  import AuthSettings from '$lib/components/admin-settings/AuthSettings.svelte';
  import BackupSettings from '$lib/components/admin-settings/BackupSettings.svelte';
  import FFmpegSettings from '$lib/components/admin-settings/FFmpegSettings.svelte';
  import ImageSettings from '$lib/components/admin-settings/ImageSettings.svelte';
  import JobSettings from '$lib/components/admin-settings/JobSettings.svelte';
  import LibrarySettings from '$lib/components/admin-settings/LibrarySettings.svelte';
  import LoggingSettings from '$lib/components/admin-settings/LoggingSettings.svelte';
  import MachineLearningSettings from '$lib/components/admin-settings/MachineLearningSettings.svelte';
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
  import { downloadManager } from '$lib/managers/download-manager.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { copyToClipboard } from '$lib/utils';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { Alert, Button, HStack, Text } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiBackupRestore,
    mdiBellOutline,
    mdiBookshelf,
    mdiClockOutline,
    mdiContentCopy,
    mdiDatabaseOutline,
    mdiDownload,
    mdiFileDocumentOutline,
    mdiFolderOutline,
    mdiImageOutline,
    mdiLockOutline,
    mdiMapMarkerOutline,
    mdiPaletteOutline,
    mdiRobotOutline,
    mdiServerOutline,
    mdiSync,
    mdiTrashCanOutline,
    mdiUpdate,
    mdiUpload,
    mdiVideoOutline,
  } from '@mdi/js';
  import type { Component } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let config = $state(data.configs);
  let adminSettingElement = $state<ReturnType<typeof AdminSettings>>();

  type SettingsComponent = Component<SettingsComponentProps>;

  // https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify/43636793#43636793
  const jsonReplacer = (key: string, value: unknown) =>
    value instanceof Object && !Array.isArray(value)
      ? Object.keys(value)
          .sort()
          // eslint-disable-next-line unicorn/no-array-reduce
          .reduce((sorted: { [key: string]: unknown }, key) => {
            sorted[key] = (value as { [key: string]: unknown })[key];
            return sorted;
          }, {})
      : value;

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, jsonReplacer, 2)], { type: 'application/json' });
    const downloadKey = 'immich-config.json';
    downloadManager.add(downloadKey, blob.size);
    downloadManager.update(downloadKey, blob.size);
    downloadBlob(blob, downloadKey);
    setTimeout(() => downloadManager.clear(downloadKey), 5000);
  };

  let inputElement: HTMLInputElement | undefined = $state();

  const uploadConfig = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = async () => {
      const text = await file.text();
      const newConfig = JSON.parse(text);
      await adminSettingElement?.handleSave(newConfig);
    };
    reader().catch((error) => console.error('Error handling JSON config upload', error));
  };

  const settings: Array<{
    component: SettingsComponent;
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
</script>

<input bind:this={inputElement} type="file" accept=".json" style="display: none" onchange={uploadConfig} />

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={1}>
      <div class="hidden lg:block">
        <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
      </div>
      <Button
        leadingIcon={mdiContentCopy}
        onclick={() => copyToClipboard(JSON.stringify(config, jsonReplacer, 2))}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('copy_to_clipboard')}</Text>
      </Button>
      <Button leadingIcon={mdiDownload} onclick={() => downloadConfig()} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('export_as_json')}</Text>
      </Button>
      {#if !$featureFlags.configFile}
        <Button
          leadingIcon={mdiUpload}
          onclick={() => inputElement?.click()}
          size="small"
          variant="ghost"
          color="secondary"
        >
          <Text class="hidden md:block">{$t('import_from_json')}</Text>
        </Button>
      {/if}
    </HStack>
  {/snippet}

  <AdminSettings bind:config bind:this={adminSettingElement}>
    {#snippet children({ savedConfig, defaultConfig })}
      <section id="setting-content" class="flex place-content-center sm:mx-4">
        <section class="w-full pb-28 sm:w-5/6 md:w-[896px]">
          {#if $featureFlags.configFile}
            <Alert color="warning" class="text-dark my-4" title={$t('admin.config_set_by_file')} />
          {/if}
          <div class="block lg:hidden">
            <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
          </div>
          <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
            {#each filteredSettings as { component: Component, title, subtitle, key, icon } (key)}
              <SettingAccordion {title} {subtitle} {key} {icon}>
                <Component
                  onSave={(config) => adminSettingElement?.handleSave(config)}
                  onReset={(options) => adminSettingElement?.handleReset(options)}
                  disabled={$featureFlags.configFile}
                  bind:config
                  {defaultConfig}
                  {savedConfig}
                />
              </SettingAccordion>
            {/each}
          </SettingAccordionState>
        </section>
      </section>
    {/snippet}
  </AdminSettings>
</AdminPageLayout>
