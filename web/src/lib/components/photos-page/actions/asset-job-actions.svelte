<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetJobName, AssetTypeEnum, api } from '@api';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

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
      await api.assetApi.runAssetJobs({ assetJobsDto: { assetIds: ids, name } });
      notificationController.show({ message: api.getAssetJobMessage(name), type: NotificationType.Info });
      clearSelect();
    } catch (error) {
      handleError(error, 'Unable to submit job');
    }
  };
</script>

{#each jobs as job}
  {#if isAllVideos || job !== AssetJobName.TranscodeVideo}
    <MenuOption text={api.getAssetJobName(job)} on:click={() => handleRunJob(job)} />
  {/if}
{/each}
