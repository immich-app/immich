<script lang="ts">
  import { type DownloadProgress, downloadAssets, downloadManager, isDownloading } from '$lib/stores/download';
  import { locale } from '$lib/stores/preferences.store';
  import { fly, slide } from 'svelte/transition';
  import { asByteUnitString } from '../../utils/byte-units';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const abort = (downloadKey: string, download: DownloadProgress) => {
    download.abort?.abort();
    downloadManager.clear(downloadKey);
  };
</script>

{#if $isDownloading}
  <div
    transition:fly={{ x: -100, duration: 350 }}
    class="absolute bottom-10 left-2 z-[10000] max-h-[270px] w-[315px] rounded-2xl border bg-immich-bg p-4 text-sm shadow-sm"
  >
    <p class="mb-2 text-xs text-gray-500">{$t('downloading')}</p>
    <div class="my-2 mb-2 flex max-h-[200px] flex-col overflow-y-auto text-sm">
      {#each Object.keys($downloadAssets) as downloadKey (downloadKey)}
        {@const download = $downloadAssets[downloadKey]}
        <div class="mb-2 flex place-items-center" transition:slide>
          <div class="w-full pr-10">
            <div class="flex place-items-center justify-between gap-2 text-xs font-medium">
              <p class="truncate">■ {downloadKey}</p>
              {#if download.total}
                <p class="whitespace-nowrap">{asByteUnitString(download.total, $locale)}</p>
              {/if}
            </div>
            <div class="flex place-items-center gap-2">
              <div class="h-[7px] w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div class="h-[7px] rounded-full bg-immich-primary" style={`width: ${download.percentage}%`} />
              </div>
              <p class="min-w-[4em] whitespace-nowrap text-right">
                <span class="text-immich-primary">{download.percentage}%</span>
              </p>
            </div>
          </div>
          <div class="absolute right-2">
            <CircleIconButton
              title={$t('close')}
              on:click={() => abort(downloadKey, download)}
              size="20"
              icon={mdiClose}
              class="dark:text-immich-dark-gray"
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
