<script lang="ts">
  import { type DownloadState, downloadManager } from '$lib/managers/download-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { CloseButton, Heading, IconButton } from '@immich/ui';
  import { mdiReload, mdiDownload } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fly, slide } from 'svelte/transition';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { downloadUrlPost } from '$lib/utils';

  const startDownload = (downloadKey: string, download: DownloadState) => {
    downloadUrlPost(download.url, download.payload);
    downloadManager.markDownloaded(downloadKey);
  };

  const closePanel = () => {
    downloadManager.clearAll();
  };
</script>

{#if downloadManager.isDownloading}
  <div
    transition:fly={{ x: -100, duration: 350 }}
    class="fixed inset-s-2 bottom-10 z-60 max-h-67.5 w-89 rounded-2xl border bg-subtle p-4 shadow-lg dark:border-white/10"
  >
    <div class="flex items-center justify-between gap-2">
      <Heading size="tiny">{$t('prepared_archives')}</Heading>
      <CloseButton class="w-8" size="small" onclick={closePanel} />
    </div>
    <div class="my-2 mb-2 flex max-h-50 flex-col overflow-y-auto text-sm">
      {#each downloadManager.assets as [downloadKey, download] (downloadKey)}
        <div class="mb-2 flex place-items-center gap-2" transition:slide>
          <div class="min-w-0 grow">
            <div class="flex place-items-center justify-between gap-2 text-xs font-medium">
              <p class="truncate">{downloadKey}</p>
              {#if download.total}
                <p class="whitespace-nowrap">{getByteUnitString(download.total, $locale)}</p>
              {/if}
            </div>
          </div>
          <div class="w-8">
            <IconButton
              color="secondary"
              variant="outline"
              shape="round"
              aria-label={$t(download.downloaded ? 'retry' : 'download')}
              onclick={() => startDownload(downloadKey, download)}
              size="tiny"
              icon={download.downloaded ? mdiReload : mdiDownload}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
