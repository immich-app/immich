<script lang="ts">
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import MachineLearningSettings from '$lib/components/admin-page/settings/machine-learning-settings/machine-learning-settings.svelte';
  import MapSettings from '$lib/components/admin-page/settings/map-settings/map-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
  import ServerSettings from '$lib/components/admin-page/settings/server/server-settings.svelte';
  import TrashSettings from '$lib/components/admin-page/settings/trash-settings/trash-settings.svelte';
  import ThemeSettings from '$lib/components/admin-page/settings/theme/theme-settings.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { downloadManager } from '$lib/stores/download';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { copyToClipboard } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { PageData } from './$types';
  import NewVersionCheckSettings from '$lib/components/admin-page/settings/new-version-check-settings/new-version-check-settings.svelte';
  import LibrarySettings from '$lib/components/admin-page/settings/library-settings/library-settings.svelte';
  import LoggingSettings from '$lib/components/admin-page/settings/logging-settings/logging-settings.svelte';
  import { mdiAlert, mdiContentCopy, mdiDownload } from '@mdi/js';
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';

  export let data: PageData;

  let config = data.configs;

  type Settings =
    | typeof JobSettings
    | typeof LibrarySettings
    | typeof LoggingSettings
    | typeof MachineLearningSettings
    | typeof MapSettings
    | typeof OAuthSettings
    | typeof PasswordLoginSettings
    | typeof ServerSettings
    | typeof StorageTemplateSettings
    | typeof ThemeSettings
    | typeof ThumbnailSettings
    | typeof TrashSettings
    | typeof NewVersionCheckSettings
    | typeof FFmpegSettings;

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const downloadKey = 'immich-config.json';
    downloadManager.add(downloadKey, blob.size);
    downloadManager.update(downloadKey, blob.size);
    downloadBlob(blob, downloadKey);
    setTimeout(() => downloadManager.clear(downloadKey), 5000);
  };

  const settings: Array<{
    item: Settings;
    title: string;
    subtitle: string;
    key: string;
  }> = [
    {
      item: JobSettings,
      title: 'Job Settings',
      subtitle: 'Manage job concurrency',
      key: 'job',
    },
    {
      item: LibrarySettings,
      title: 'Library',
      subtitle: 'Manage library settings',
      key: 'library',
    },
    {
      item: LoggingSettings,
      title: 'Logging',
      subtitle: 'Manage log settings',
      key: 'logging',
    },
    {
      item: MachineLearningSettings,
      title: 'Machine Learning Settings',
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
      item: OAuthSettings,
      title: 'OAuth Authentication',
      subtitle: 'Manage the login with OAuth settings',
      key: 'oauth',
    },
    {
      item: PasswordLoginSettings,
      title: 'Password Authentication',
      subtitle: 'Manage the login with password settings',
      key: 'password',
    },
    {
      item: ServerSettings,
      title: 'Server Settings',
      subtitle: 'Manage server settings',
      key: 'server',
    },
    {
      item: StorageTemplateSettings,
      title: 'Storage Template',
      subtitle: 'Manage the folder structure and file name of the upload asset',
      key: 'storage-template',
    },
    {
      item: ThemeSettings,
      title: 'Theme Settings',
      subtitle: 'Manage customization of the Immich web interface',
      key: 'theme',
    },
    {
      item: ThumbnailSettings,
      title: 'Thumbnail Settings',
      subtitle: 'Manage the resolution of thumbnail sizes',
      key: 'thumbnail',
    },
    {
      item: TrashSettings,
      title: 'Trash Settings',
      subtitle: 'Manage trash settings',
      key: 'trash',
    },
    {
      item: NewVersionCheckSettings,
      title: 'Version Check',
      subtitle: 'Enable/disable the new version notification',
      key: 'version-check',
    },
    {
      item: FFmpegSettings,
      title: 'Video Transcoding Settings',
      subtitle: 'Manage the resolution and encoding information of the video files',
      key: 'video-transcoding',
    },
  ];
</script>

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
    </div>

    <AdminSettings bind:config let:handleReset let:handleSave let:savedConfig let:defaultConfig>
      <section id="setting-content" class="flex place-content-center sm:mx-4">
        <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
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
        </section>
      </section>
    </AdminSettings>
  </UserPageLayout>
</div>
