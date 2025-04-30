<script lang="ts">
  import { type DownloadProgress, downloadManager } from '$lib/managers/download-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fly, slide } from 'svelte/transition';
  import { getByteUnitString } from '../../utils/byte-units';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  const abort = (downloadKey: string, download: DownloadProgress) => {
    download.abort?.abort();
    downloadManager.clear(downloadKey);
  };
</script>

{#if downloadManager.isDownloading}
  <div
    transition:fly={{ x: -100, duration: 350 }}
    class="fixed bottom-10 start-2 z-[10000] max-h-[270px] w-[315px] rounded-2xl border bg-immich-bg p-4 text-sm shadow-sm"
  >
    <p class="mb-2 text-xs text-gray-500">{$t('downloading').toUpperCase()}</p>
    <div class="my-2 mb-2 flex max-h-[200px] flex-col overflow-y-auto text-sm">
      {#each Object.keys(downloadManager.assets) as downloadKey (downloadKey)}
        {@const download = downloadManager.assets[downloadKey]}
        <div class="mb-2 flex place-items-center" transition:slide>
          <div class="w-full pe-10">
            <div class="flex place-items-center justify-between gap-2 text-xs font-medium">
              <p class="truncate">■ {downloadKey}</p>
              {#if download.total}
                <p class="whitespace-nowrap">{getByteUnitString(download.total, $locale)}</p>
              {/if}
            </div>
            <div class="flex place-items-center gap-2">
              <div class="h-[7px] w-full rounded-full bg-gray-200">
                <div class="h-[7px] rounded-full bg-immich-primary" style={`width: ${download.percentage}%`}></div>
              </div>
              <p class="min-w-[4em] whitespace-nowrap text-right">
                <span class="text-immich-primary">
                  {(download.percentage / 100).toLocaleString($locale, { style: 'percent' })}
                </span>
              </p>
            </div>
          </div>
          <div class="absolute end-2">
            <CircleIconButton
              title={$t('close')}
              onclick={() => abort(downloadKey, download)}
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
