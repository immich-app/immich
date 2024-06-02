<script lang="ts">
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import AuthSettings from '$lib/components/admin-page/settings/auth/auth-settings.svelte';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import ImageSettings from '$lib/components/admin-page/settings/image/image-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
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
  import { mdiAlert, mdiContentCopy, mdiDownload, mdiUpload } from '@mdi/js';
  import type { PageData } from './$types';
  import { t } from 'svelte-i18n';

  export let data: PageData;

  let config = data.configs;
  let handleSave: (update: Partial<SystemConfigDto>) => Promise<void>;

  type Settings =
    | typeof AuthSettings
    | typeof JobSettings
    | typeof LibrarySettings
    | typeof LoggingSettings
    | typeof MachineLearningSettings
    | typeof MapSettings
    | typeof ServerSettings
    | typeof StorageTemplateSettings
    | typeof ThemeSettings
    | typeof ImageSettings
    | typeof TrashSettings
    | typeof NewVersionCheckSettings
    | typeof NotificationSettings
    | typeof FFmpegSettings
    | typeof UserSettings;

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
    item: Settings;
    title: string;
    subtitle: string;
    key: string;
  }> = [
    {
      item: AuthSettings,
      title: $t('authentication_settings'),
      subtitle: 'Manage password, OAuth, and other authentication settings',
      key: 'image',
    },
    {
      item: ImageSettings,
      title: $t('image_settings'),
      subtitle: 'Manage the quality and resolution of generated images',
      key: 'image',
    },
    {
      item: JobSettings,
      title: $t('job_settings'),
      subtitle: $t('manage_job_concurrency'),
      key: 'job',
    },
    {
      item: LibrarySettings,
      title: $t('external_library'),
      subtitle: $t('manage_external_library_settings'),
      key: 'external-library',
    },
    {
      item: LoggingSettings,
      title: $t('logging'),
      subtitle: $t('manage_log_settings'),
      key: 'logging',
    },
    {
      item: MachineLearningSettings,
      title: $t('machine_learning_settings'),
      subtitle: 'Manage machine learning features and settings',
      key: 'machine-learning',
    },
    {
      item: MapSettings,
      title: 'Map & GPS Settings',
      subtitle: 'Manage map related features and setting',
      key: 'location',
    },
    {
      item: NotificationSettings,
      title: $t('notification_settings'),
      subtitle: 'Manage notification settings, including email',
      key: 'notifications',
    },
    {
      item: ServerSettings,
      title: $t('server_settings'),
      subtitle: $t('manage_server_settings'),
      key: 'server',
    },
    {
      item: StorageTemplateSettings,
      title: $t('storage_template'),
      subtitle: 'Manage the folder structure and file name of the upload asset',
      key: 'storage-template',
    },
    {
      item: ThemeSettings,
      title: $t('theme_settings'),
      subtitle: 'Manage customization of the Immich web interface',
      key: 'theme',
    },
    {
      item: TrashSettings,
      title: $t('trash_settings'),
      subtitle: $t('manage_trash_settings'),
      key: 'trash',
    },
    {
      item: UserSettings,
      title: $t('user_settings'),
      subtitle: $t('manage_user_settings'),
      key: 'user-settings',
    },
    {
      item: NewVersionCheckSettings,
      title: $t('version_check'),
      subtitle: 'Enable/disable the new version notification',
      key: 'version-check',
    },
    {
      item: FFmpegSettings,
      title: $t('video_transcoding_settings'),
      subtitle: 'Manage the resolution and encoding information of the video files',
      key: 'video-transcoding',
    },
  ];
</script>

<input bind:this={inputElement} type="file" accept=".json" style="display: none" on:change={uploadConfig} />

<div class="h-svh flex flex-col overflow-hidden">
  {#if $featureFlags.configFile}
    <div class="flex flex-row items-center gap-2 bg-gray-100 p-3 dark:bg-gray-800">
      <Icon path={mdiAlert} class="text-yellow-400" size={18} />
      <h2 class="text-md text-immich-primary dark:text-immich-dark-primary">
        Config is currently set by a config file
      </h2>
    </div>
  {/if}

  <UserPageLayout title={data.meta.title} admin>
    <div class="flex justify-end gap-2" slot="buttons">
      <LinkButton on:click={() => copyToClipboard(JSON.stringify(config, null, 2))}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiContentCopy} size="18" />
          Copy to Clipboard
        </div>
      </LinkButton>
      <LinkButton on:click={() => downloadConfig()}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiDownload} size="18" />
          Export as JSON
        </div>
      </LinkButton>
      <LinkButton on:click={() => inputElement?.click()}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiUpload} size="18" />
          Import from JSON
        </div>
      </LinkButton>
    </div>

    <AdminSettings bind:config let:handleReset bind:handleSave let:savedConfig let:defaultConfig>
      <section id="setting-content" class="flex place-content-center sm:mx-4">
        <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
          <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
            {#each settings as { item, title, subtitle, key }}
              <SettingAccordion {title} {subtitle} {key}>
                <svelte:component
                  this={item}
                  on:save={({ detail }) => handleSave(detail)}
                  on:reset={({ detail }) => handleReset(detail)}
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
