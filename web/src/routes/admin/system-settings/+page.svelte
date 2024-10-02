<script lang="ts">
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import AuthSettings from '$lib/components/admin-page/settings/auth/auth-settings.svelte';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import ImageSettings from '$lib/components/admin-page/settings/image/image-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import MetadataSettings from '$lib/components/admin-page/settings/metadata-settings/metadata-settings.svelte';
  import LibrarySettings from '$lib/components/admin-page/settings/library-settings/library-settings.svelte';
  import LoggingSettings from '$lib/components/admin-page/settings/logging-settings/logging-settings.svelte';
  import MachineLearningSettings from '$lib/components/admin-page/settings/machine-learning-settings/machine-learning-settings.svelte';
  import MapSettings from '$lib/components/admin-page/settings/map-settings/map-settings.svelte';
  import NewVersionCheckSettings from '$lib/components/admin-page/settings/new-version-check-settings/new-version-check-settings.svelte';
  import NotificationSettings from '$lib/components/admin-page/settings/notification-settings/notification-settings.svelte';
  import ServerSettings from '$lib/components/admin-page/settings/server/server-settings.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import ThemeSettings from '$lib/components/admin-page/settings/theme/theme-settings.svelte';
  import TrashSettings from '$lib/components/admin-page/settings/trash-settings/trash-settings.svelte';
  import UserSettings from '$lib/components/admin-page/settings/user-settings/user-settings.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SettingAccordionState from '$lib/components/shared-components/settings/setting-accordion-state.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { QueryParameter } from '$lib/constants';
  import { downloadManager } from '$lib/stores/download';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { copyToClipboard } from '$lib/utils';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import type { SystemConfigDto } from '@immich/sdk';
  import {
    mdiAccountOutline,
    mdiAlert,
    mdiBellOutline,
    mdiBookshelf,
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
  import type { PageData } from './$types';
  import { t } from 'svelte-i18n';
  import type { ComponentType, SvelteComponent } from 'svelte';
  import type { SettingsComponentProps } from '$lib/components/admin-page/settings/admin-settings';
  import SearchBar from '$lib/components/elements/search-bar.svelte';

  export let data: PageData;

  let config = data.configs;
  let handleSave: (update: Partial<SystemConfigDto>) => Promise<void>;

  type SettingsComponent = ComponentType<SvelteComponent<SettingsComponentProps>>;

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const downloadKey = 'immich-config.json';
    downloadManager.add(downloadKey, blob.size);
    downloadManager.update(downloadKey, blob.size);
    downloadBlob(blob, downloadKey);
    setTimeout(() => downloadManager.clear(downloadKey), 5000);
  };

  let inputElement: HTMLInputElement;
  const uploadConfig = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = async () => {
      const text = await file.text();
      const newConfig = JSON.parse(text);
      await handleSave(newConfig);
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
      component: MetadataSettings,
      title: $t('admin.metadata_settings'),
      subtitle: $t('admin.metadata_settings_description'),
      key: 'metadata',
      icon: mdiDatabaseOutline,
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

  let searchQuery = '';

  $: filteredSettings = settings.filter(({ title, subtitle }) => {
    const query = searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query);
  });
</script>

<input bind:this={inputElement} type="file" accept=".json" style="display: none" on:change={uploadConfig} />

<div class="h-svh flex flex-col overflow-hidden">
  {#if $featureFlags.configFile}
    <div class="flex flex-row items-center gap-2 bg-gray-100 p-3 dark:bg-gray-800">
      <Icon path={mdiAlert} class="text-yellow-400" size={18} />
      <h2 class="text-md text-immich-primary dark:text-immich-dark-primary">
        {$t('admin.config_set_by_file')}
      </h2>
    </div>
  {/if}

  <UserPageLayout title={data.meta.title} admin>
    <div class="flex justify-end gap-2" slot="buttons">
      <div class="hidden lg:block">
        <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
      </div>
      <LinkButton on:click={() => copyToClipboard(JSON.stringify(config, null, 2))}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiContentCopy} size="18" />
          {$t('copy_to_clipboard')}
        </div>
      </LinkButton>
      <LinkButton on:click={() => downloadConfig()}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiDownload} size="18" />
          {$t('export_as_json')}
        </div>
      </LinkButton>
      {#if !$featureFlags.configFile}
        <LinkButton on:click={() => inputElement?.click()}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiUpload} size="18" />
            {$t('import_from_json')}
          </div>
        </LinkButton>
      {/if}
    </div>

    <AdminSettings bind:config let:handleReset bind:handleSave let:savedConfig let:defaultConfig>
      <section id="setting-content" class="flex place-content-center sm:mx-4">
        <section class="w-full pb-28 sm:w-5/6 md:w-[896px]">
          <div class="block lg:hidden">
            <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
          </div>
          <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
            {#each filteredSettings as { component: Component, title, subtitle, key, icon } (key)}
              <SettingAccordion {title} {subtitle} {key} {icon}>
                <Component
                  onSave={(config) => handleSave(config)}
                  onReset={(options) => handleReset(options)}
                  disabled={$featureFlags.configFile}
                  {defaultConfig}
                  {config}
                  {savedConfig}
                />
              </SettingAccordion>
            {/each}
          </SettingAccordionState>
        </section>
      </section>
    </AdminSettings>
  </UserPageLayout>
</div>
