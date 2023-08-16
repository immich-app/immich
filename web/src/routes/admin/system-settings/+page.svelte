<script lang="ts">
  import { page } from '$app/stores';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import { api, type SystemConfigDto, type SystemConfigTemplateStorageOptionDto } from '@api';
  import type { PageData } from './$types';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';

  export let data: PageData;
  let config: SystemConfigDto = data.config;

  let currentConfig: SystemConfigDto = JSON.parse(JSON.stringify(config));
  let defaultConfig: SystemConfigDto = data.defaultConfig;
  let templateOptions: SystemConfigTemplateStorageOptionDto = data.templateOptions;

  const handleSave = async (config: SystemConfigDto, settingsMessage: string) => {
    try {
      const { data } = await api.systemConfigApi.updateConfig({
        systemConfigDto: config,
      });

      config = JSON.parse(JSON.stringify(data));
      currentConfig = JSON.parse(JSON.stringify(data));
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
  $: {
    console.log(config);
  }
</script>

<SettingAccordion title="Thumbnail Settings" subtitle="Manage the resolution of thumbnail sizes">
  <ThumbnailSettings
    bind:savedConfig={currentConfig.thumbnail}
    bind:thumbnailConfig={config.thumbnail}
    thumbnailDefault={defaultConfig.thumbnail}
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
    on:save={({ detail: ffmpeg }) => {
      handleSave(
        {
          ...currentConfig,
          ffmpeg,
        },
        'ffmpeg',
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
    bind:config
    bind:jobConfig={config.job}
    jobDefault={defaultConfig.job}
    on:save={({ detail: job }) => {
      handleSave(
        {
          ...currentConfig,
          job,
        },
        'Password Authentication',
      );
    }}
  />
</SettingAccordion>

<SettingAccordion title="Password Authentication" subtitle="Manage login with password settings">
  <PasswordLoginSettings
    bind:savedConfig={currentConfig.passwordLogin}
    bind:passwordLoginConfig={config.passwordLogin}
    bind:config
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

<SettingAccordion title="OAuth Authentication" subtitle="Manage the login with OAuth settings">
  <OAuthSettings
    bind:savedConfig={currentConfig.oauth}
    bind:oauthConfig={config.oauth}
    bind:config
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
