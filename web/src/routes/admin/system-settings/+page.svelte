<script lang="ts">
  import { page } from '$app/stores';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import MachineLearningSettings from '$lib/components/admin-page/settings/machine-learning-settings/machine-learning-settings.svelte';
  import MapSettings from '$lib/components/admin-page/settings/map-settings/map-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
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

  export let data: PageData;

  const configs = data.configs;

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' });
    const downloadKey = 'immich-config.json';
    downloadManager.add(downloadKey, blob.size);
    downloadManager.update(downloadKey, blob.size);
    downloadBlob(blob, downloadKey);
    setTimeout(() => downloadManager.clear(downloadKey), 5_000);
  };
</script>

{#if $featureFlags.configFile}
  <div class="mb-8 flex flex-row items-center gap-2 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
    <Icon path={mdiAlert} class="text-yellow-400" size={18} />
    <h2 class="text-md text-immich-primary dark:text-immich-dark-primary">Config is currently set by a config file</h2>
  </div>
{/if}

<UserPageLayout title={data.meta.title} admin>
  <div class="flex justify-end gap-2" slot="buttons">
    <LinkButton on:click={() => copyToClipboard(JSON.stringify(configs, null, 2))}>
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

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <SettingAccordion
        title="Job Settings"
        subtitle="Manage job concurrency"
        isOpen={$page.url.searchParams.get('open') === 'job-settings'}
      >
        <JobSettings disabled={$featureFlags.configFile} jobConfig={configs.job} />
      </SettingAccordion>

      <SettingAccordion title="Library" subtitle="Manage library settings">
        <LibrarySettings disabled={$featureFlags.configFile} libraryConfig={configs.library} />
      </SettingAccordion>

      <SettingAccordion title="Logging" subtitle="Manage log settings">
        <LoggingSettings disabled={$featureFlags.configFile} loggingConfig={configs.logging} />
      </SettingAccordion>

      <SettingAccordion title="Machine Learning Settings" subtitle="Manage machine learning features and settings">
        <MachineLearningSettings disabled={$featureFlags.configFile} machineLearningConfig={configs.machineLearning} />
      </SettingAccordion>

      <SettingAccordion title="Map & GPS Settings" subtitle="Manage map related features and setting">
        <MapSettings disabled={$featureFlags.configFile} config={configs} />
      </SettingAccordion>

      <SettingAccordion title="OAuth Authentication" subtitle="Manage the login with OAuth settings">
        <OAuthSettings disabled={$featureFlags.configFile} oauthConfig={configs.oauth} />
      </SettingAccordion>

      <SettingAccordion title="Password Authentication" subtitle="Manage login with password settings">
        <PasswordLoginSettings disabled={$featureFlags.configFile} passwordLoginConfig={configs.passwordLogin} />
      </SettingAccordion>

      <SettingAccordion
        title="Storage Template"
        subtitle="Manage the folder structure and file name of the upload asset"
        isOpen={$page.url.searchParams.get('open') === 'storage-template'}
      >
        <StorageTemplateSettings disabled={$featureFlags.configFile} storageConfig={configs.storageTemplate} />
      </SettingAccordion>

      <SettingAccordion title="Theme Settings" subtitle="Manage customization of the Immich web interface">
        <ThemeSettings disabled={$featureFlags.configFile} themeConfig={configs.theme} />
      </SettingAccordion>

      <SettingAccordion title="Thumbnail Settings" subtitle="Manage the resolution of thumbnail sizes">
        <ThumbnailSettings disabled={$featureFlags.configFile} thumbnailConfig={configs.thumbnail} />
      </SettingAccordion>

      <SettingAccordion title="Trash Settings" subtitle="Manage trash settings">
        <TrashSettings disabled={$featureFlags.configFile} trashConfig={configs.trash} />
      </SettingAccordion>

      <SettingAccordion title="Version Check" subtitle="Enable/disable the new version notification">
        <NewVersionCheckSettings newVersionCheckConfig={configs.newVersionCheck} />
      </SettingAccordion>

      <SettingAccordion
        title="Video Transcoding Settings"
        subtitle="Manage the resolution and encoding information of the video files"
      >
        <FFmpegSettings disabled={$featureFlags.configFile} ffmpegConfig={configs.ffmpeg} />
      </SettingAccordion>
    </section>
  </section>
</UserPageLayout>
