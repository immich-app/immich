<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { getAssetJobIcon, getAssetJobMessage, getAssetJobName } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetJobName, AssetTypeEnum, runAssetJobs } from '@immich/sdk';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { t } from 'svelte-i18n';

  export let jobs: AssetJobName[] = [
    AssetJobName.RegenerateThumbnail,
    AssetJobName.RefreshMetadata,
    AssetJobName.TranscodeVideo,
  ];

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  $: isAllVideos = [...getOwnedAssets()].every((asset) => asset.type === AssetTypeEnum.Video);

  const handleRunJob = async (name: AssetJobName) => {
    try {
      const ids = [...getOwnedAssets()].map(({ id }) => id);
      await runAssetJobs({ assetJobsDto: { assetIds: ids, name } });
      notificationController.show({ message: getAssetJobMessage(name), type: NotificationType.Info });
      clearSelect();
    } catch (error) {
      handleError(error, $t('unable_to_submit_job'));
    }
  };
</script>

{#each jobs as job}
  {#if isAllVideos || job !== AssetJobName.TranscodeVideo}
    <MenuOption text={getAssetJobName(job)} icon={getAssetJobIcon(job)} on:click={() => handleRunJob(job)} />
  {/if}
{/each}
