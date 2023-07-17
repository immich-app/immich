<script lang="ts">
  import { DownloadProgress, downloadAssets, downloadManager, isDownloading } from '$lib/stores/download';
  import { locale } from '$lib/stores/preferences.store';
  import Close from 'svelte-material-icons/Close.svelte';
  import { fly, slide } from 'svelte/transition';
  import { asByteUnitString } from '../../utils/byte-units';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  const abort = (downloadKey: string, download: DownloadProgress) => {
    download.abort?.abort();
    downloadManager.clear(downloadKey);
  };
</script>

{#if $isDownloading}
  <div
    transition:fly={{ x: -100, duration: 350 }}
    class="w-[315px] max-h-[270px] bg-immich-bg border rounded-2xl shadow-sm absolute bottom-10 left-2 p-4 z-[10000] text-sm"
  >
    <p class="text-gray-500 text-xs mb-2">DOWNLOADING</p>
    <div class="max-h-[200px] my-2 overflow-y-auto mb-2 flex flex-col text-sm">
      {#each Object.keys($downloadAssets) as downloadKey (downloadKey)}
        {@const download = $downloadAssets[downloadKey]}
        <div class="mb-2 flex place-items-center" transition:slide>
          <div class="w-full pr-10">
            <div class="font-medium text-xs flex gap-2 place-items-center justify-between">
              <p class="truncate">■ {downloadKey}</p>
              {#if download.total}
                <p class="whitespace-nowrap">{asByteUnitString(download.total, $locale)}</p>
              {/if}
            </div>
            <div class="flex place-items-center gap-2">
              <div class="w-full bg-gray-200 rounded-full h-[7px] dark:bg-gray-700">
                <div class="bg-immich-primary h-[7px] rounded-full" style={`width: ${download.percentage}%`} />
              </div>
              <p class="whitespace-nowrap min-w-[4em] text-right">
                <span class="text-immich-primary">{download.percentage}%</span>
              </p>
            </div>
          </div>
          <div class="absolute right-2">
            <CircleIconButton on:click={() => abort(downloadKey, download)} size="20" logo={Close} forceDark />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
