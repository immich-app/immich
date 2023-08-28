<script lang="ts">
  import { page } from '$app/stores';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import MachineLearningSettings from '$lib/components/admin-page/settings/machine-learning-settings/machine-learning-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { downloadManager } from '$lib/stores/download';
  import { featureFlags } from '$lib/stores/feature-flags.store';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { SystemConfigDto, SystemConfigTemplateStorageOptionDto, api, copyToClipboard } from '@api';
  import Alert from 'svelte-material-icons/Alert.svelte';
  import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
  import Download from 'svelte-material-icons/Download.svelte';
  import type { PageData } from './$types';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { cloneDeep } from 'lodash-es';

  export let data: PageData;
  let config: SystemConfigDto = data.config;

  let currentConfig: SystemConfigDto = cloneDeep(config);
  let defaultConfig: SystemConfigDto = data.defaultConfig;
  let templateOptions: SystemConfigTemplateStorageOptionDto = data.templateOptions;

  const handleSave = async (config: SystemConfigDto, settingsMessage: string) => {
    try {
      const { data } = await api.systemConfigApi.updateConfig({
        systemConfigDto: config,
      });

      config = cloneDeep(data);
      currentConfig = cloneDeep(data);
      notificationController.show({
        message: `${settingsMessage} settings saved`,
        type: NotificationType.Info,
      });
    } catch (e) {
      console.error(`Error [${settingsMessage}-settings] [saveSetting]`, e);
      notificationController.show({
        message: 'Unable to save settings',
        type: NotificationType.Error,
      });
    }
  };

  const downloadConfig = (configs: SystemConfigDto) => {
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
    <Alert class="text-yellow-400" size={18} />
    <h2 class="text-md text-immich-primary dark:text-immich-dark-primary">Config is currently set by a config file</h2>
  </div>
{/if}
<div class="flex justify-end gap-2">
  <Button size="sm" on:click={() => copyToClipboard(JSON.stringify(config, null, 2))}>
    <ContentCopy size="18" />
    <span class="pl-2">Copy to Clipboard</span>
  </Button>
  <Button size="sm" on:click={() => downloadConfig(config)}>
    <Download size="18" />
    <span class="pl-2">Export as JSON</span>
  </Button>
</div>
<SettingAccordion title="Thumbnail Settings" subtitle="Manage the resolution of thumbnail sizes">
  <ThumbnailSettings
    bind:savedConfig={currentConfig.thumbnail}
    bind:thumbnailConfig={config.thumbnail}
    thumbnailDefault={defaultConfig.thumbnail}
    disabled={$featureFlags.configFile}
    on:save={({ detail: thumbnail }) => {
      handleSave(
        {
          ...currentConfig,
          thumbnail,
        },
        'Thumbnail',
      );
    }}
  />
</SettingAccordion>

<SettingAccordion title="FFmpeg Settings" subtitle="Manage the resolution and encoding information of the video files">
  <FFmpegSettings
    bind:savedConfig={currentConfig.ffmpeg}
    bind:ffmpegConfig={config.ffmpeg}
    ffmpegDefault={defaultConfig.ffmpeg}
    disabled={$featureFlags.configFile}
    on:save={({ detail: ffmpeg }) => {
      handleSave(
        {
          ...currentConfig,
          ffmpeg,
        },
        'FFmpeg',
      );
    }}
  />
</SettingAccordion>

<SettingAccordion
  title="Job Settings"
  subtitle="Manage job concurrency"
  isOpen={$page.url.searchParams.get('open') === 'job-settings'}
>
  <JobSettings
    bind:savedConfig={currentConfig.job}
    bind:jobConfig={config.job}
    jobDefault={defaultConfig.job}
    disabled={$featureFlags.configFile}
    on:save={({ detail: job }) => {
      handleSave(
        {
          ...currentConfig,
          job,
        },
        'Job Settings',
      );
    }}
  />
</SettingAccordion>

<SettingAccordion title="Password Authentication" subtitle="Manage login with password settings">
  <PasswordLoginSettings
    bind:savedConfig={currentConfig.passwordLogin}
    bind:passwordLoginConfig={config.passwordLogin}
    bind:config
    disabled={$featureFlags.configFile}
    passwordLoginDefault={defaultConfig.passwordLogin}
    on:save={({ detail: passwordLogin }) => {
      handleSave(
        {
          ...currentConfig,
          passwordLogin,
        },
        'Password Authentication',
      );
    }}
  />
</SettingAccordion>
<SettingAccordion title="Machine Learning" subtitle="Manage machine learning settings">
  <MachineLearningSettings disabled={$featureFlags.configFile} />
</SettingAccordion>
<SettingAccordion title="OAuth Authentication" subtitle="Manage the login with OAuth settings">
  <OAuthSettings
    bind:savedConfig={currentConfig.oauth}
    bind:oauthConfig={config.oauth}
    bind:config
    disabled={$featureFlags.configFile}
    oauthDefault={defaultConfig.oauth}
    on:save={({ detail: oauth }) => {
      handleSave(
        {
          ...currentConfig,
          oauth,
        },
        'OAuth Authentication',
      );
    }}
  />
</SettingAccordion>

<SettingAccordion
  title="Storage Template"
  subtitle="Manage the folder structure and file name of the upload asset"
  isOpen={$page.url.searchParams.get('open') === 'storage-template'}
>
  <StorageTemplateSettings
    savedConfig={currentConfig.storageTemplate}
    storageConfig={config.storageTemplate}
    user={data.user}
    storageDefault={defaultConfig.storageTemplate}
    {templateOptions}
    on:save={({ detail: storageTemplate }) => {
      handleSave(
        {
          ...currentConfig,
          storageTemplate,
        },
        'Storage Template',
      );
    }}
  />
</SettingAccordion>
