<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { getAssetJobIcon, getAssetJobMessage, getAssetJobName } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetJobName, runAssetJobs } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    jobs?: AssetJobName[];
  }

  let { jobs = [AssetJobName.RegenerateThumbnail, AssetJobName.RefreshMetadata, AssetJobName.TranscodeVideo] }: Props =
    $props();

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const isAllVideos = $derived([...getOwnedAssets()].every((asset) => asset.isVideo));

  const handleRunJob = async (name: AssetJobName) => {
    try {
      const ids = [...getOwnedAssets()].map(({ id }) => id);
      await runAssetJobs({ assetJobsDto: { assetIds: ids, name } });
      toastManager.success($getAssetJobMessage(name));
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  };
</script>

{#each jobs as job (job)}
  {#if isAllVideos || job !== AssetJobName.TranscodeVideo}
    <MenuOption text={$getAssetJobName(job)} icon={getAssetJobIcon(job)} onClick={() => handleRunJob(job)} />
  {/if}
{/each}
