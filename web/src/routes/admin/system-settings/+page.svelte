<script lang="ts">
  import { page } from '$app/stores';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import type { SystemConfigDto, SystemConfigTemplateStorageOptionDto } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;
  let config: SystemConfigDto = data.config;
  let currentConfig: SystemConfigDto = JSON.parse(JSON.stringify(config));
  let defaultConfig: SystemConfigDto = data.defaultConfig;
  let templateOptions: SystemConfigTemplateStorageOptionDto = data.templateOptions;
</script>

<SettingAccordion title="Thumbnail Settings" subtitle="Manage the resolution of thumbnail sizes">
  <ThumbnailSettings
    savedConfig={currentConfig.thumbnail}
    bind:config={currentConfig}
    thumbnailConfig={config.thumbnail}
    thumbnailDefault={defaultConfig.thumbnail}
  />
</SettingAccordion>

<SettingAccordion title="FFmpeg Settings" subtitle="Manage the resolution and encoding information of the video files">
  <FFmpegSettings
    savedConfig={currentConfig.ffmpeg}
    bind:config={currentConfig}
    ffmpegConfig={config.ffmpeg}
    ffmpegDefault={defaultConfig.ffmpeg}
  />
</SettingAccordion>

<SettingAccordion
  title="Job Settings"
  subtitle="Manage job concurrency"
  isOpen={$page.url.searchParams.get('open') === 'job-settings'}
>
  <JobSettings savedConfig={currentConfig.job} bind:config jobConfig={config.job} jobDefault={defaultConfig.job} />
</SettingAccordion>

<SettingAccordion title="Password Authentication" subtitle="Manage login with password settings">
  <PasswordLoginSettings
    savedConfig={currentConfig.passwordLogin}
    bind:config={currentConfig}
    passwordLoginConfig={config.passwordLogin}
    passwordLoginDefault={defaultConfig.passwordLogin}
  />
</SettingAccordion>

<SettingAccordion title="OAuth Authentication" subtitle="Manage the login with OAuth settings">
  <OAuthSettings
    savedConfig={currentConfig.oauth}
    bind:config={currentConfig}
    oauthConfig={config.oauth}
    oauthDefault={defaultConfig.oauth}
  />
</SettingAccordion>

<SettingAccordion
  title="Storage Template"
  subtitle="Manage the folder structure and file name of the upload asset"
  isOpen={$page.url.searchParams.get('open') === 'storage-template'}
>
  <StorageTemplateSettings
    savedConfig={currentConfig.storageTemplate}
    bind:config={currentConfig}
    storageConfig={config.storageTemplate}
    user={data.user}
    storageDefault={defaultConfig.storageTemplate}
    {templateOptions}
  />
</SettingAccordion>
