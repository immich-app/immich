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
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { downloadManager } from '$lib/stores/download';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { SystemConfigDto, api, copyToClipboard } from '@api';
  import Alert from 'svelte-material-icons/Alert.svelte';
  import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
  import Download from 'svelte-material-icons/Download.svelte';
  import type { PageData } from './$types';
  import TrashSettings from '$lib/components/admin-page/settings/trash-settings/trash-settings.svelte';

  export let data: PageData;

  const getConfig = async () => {
    const { data } = await api.systemConfigApi.getConfig();
    return data;
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

<section class="">
  {#await getConfig()}
    <LoadingSpinner />
  {:then configs}
    <div class="flex justify-end gap-2">
      <Button size="sm" on:click={() => copyToClipboard(JSON.stringify(configs, null, 2))}>
        <ContentCopy size="18" />
        <span class="pl-2">Copy to Clipboard</span>
      </Button>
      <Button size="sm" on:click={() => downloadConfig(configs)}>
        <Download size="18" />
        <span class="pl-2">Export as JSON</span>
      </Button>
    </div>

    <SettingAccordion
      title="Job Settings"
      subtitle="Manage job concurrency"
      isOpen={$page.url.searchParams.get('open') === 'job-settings'}
    >
      <JobSettings disabled={$featureFlags.configFile} jobConfig={configs.job} />
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
      <StorageTemplateSettings
        disabled={$featureFlags.configFile}
        storageConfig={configs.storageTemplate}
        user={data.user}
      />
    </SettingAccordion>

    <SettingAccordion title="Thumbnail Settings" subtitle="Manage the resolution of thumbnail sizes">
      <ThumbnailSettings disabled={$featureFlags.configFile} thumbnailConfig={configs.thumbnail} />
    </SettingAccordion>

    <SettingAccordion title="Trash Settings" subtitle="Manage trash settings">
      <TrashSettings disabled={$featureFlags.configFile} trashConfig={configs.trash} />
    </SettingAccordion>

    <SettingAccordion
      title="Video Transcoding Settings"
      subtitle="Manage the resolution and encoding information of the video files"
    >
      <FFmpegSettings disabled={$featureFlags.configFile} ffmpegConfig={configs.ffmpeg} />
    </SettingAccordion>
  {/await}
</section>
