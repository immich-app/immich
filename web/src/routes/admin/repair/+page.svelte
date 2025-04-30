<script lang="ts">
  import empty4Url from '$lib/assets/empty-4.svg';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { downloadManager } from '$lib/managers/download-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { copyToClipboard } from '$lib/utils';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { fixAuditFiles, getAuditFiles, getFileChecksums, type FileReportItemDto } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiCheckAll, mdiContentCopy, mdiDownload, mdiRefresh, mdiWrench } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  interface UntrackedFile {
    filename: string;
    checksum: string | null;
  }

  interface Match {
    orphan: FileReportItemDto;
    extra: UntrackedFile;
  }

  const normalize = (filenames: string[]) => filenames.map((filename) => ({ filename, checksum: null }));

  let checking = $state(false);
  let repairing = $state(false);

  let orphans: FileReportItemDto[] = $state(data.orphans);
  let extras: UntrackedFile[] = $state(normalize(data.extras));
  let matches: Match[] = $state([]);

  const handleDownload = () => {
    if (extras.length > 0) {
      const blob = new Blob([extras.map(({ filename }) => filename).join('\n')], { type: 'text/plain' });
      const downloadKey = 'untracked.txt';
      downloadManager.add(downloadKey, blob.size);
      downloadManager.update(downloadKey, blob.size);
      downloadBlob(blob, downloadKey);
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }

    if (orphans.length > 0) {
      const blob = new Blob([JSON.stringify(orphans, null, 4)], { type: 'application/json' });
      const downloadKey = 'orphans.json';
      downloadManager.add(downloadKey, blob.size);
      downloadManager.update(downloadKey, blob.size);
      downloadBlob(blob, downloadKey);
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  };

  const handleRepair = async () => {
    if (matches.length === 0) {
      return;
    }

    repairing = true;

    try {
      await fixAuditFiles({
        fileReportFixDto: {
          items: matches.map(({ orphan, extra }) => ({
            entityId: orphan.entityId,
            entityType: orphan.entityType,
            pathType: orphan.pathType,
            pathValue: extra.filename,
          })),
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: $t('admin.repaired_items', { values: { count: matches.length } }),
      });

      matches = [];
    } catch (error) {
      handleError(error, $t('errors.unable_to_repair_items'));
    } finally {
      repairing = false;
    }
  };

  const handleSplit = (match: Match) => {
    matches = matches.filter((_match) => _match !== match);
    orphans = [match.orphan, ...orphans];
    extras = [match.extra, ...extras];
  };

  const handleRefresh = async () => {
    matches = [];
    orphans = [];
    extras = [];

    try {
      const report = await getAuditFiles();

      orphans = report.orphans;
      extras = normalize(report.extras);

      notificationController.show({ message: $t('refreshed'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_items'));
    }
  };

  const handleCheckOne = async (filename: string) => {
    try {
      const matched = await loadAndMatch([filename]);
      if (matched) {
        notificationController.show({
          message: $t('admin.repair_matched_items', { values: { count: 1 } }),
          type: NotificationType.Info,
        });
      }
    } catch (error) {
      handleError(error, $t('errors.repair_unable_to_check_items', { values: { count: 'one' } }));
    }
  };

  const handleCheckAll = async () => {
    checking = true;

    let count = 0;

    try {
      const chunkSize = 10;
      const filenames = extras.filter(({ checksum }) => !checksum).map(({ filename }) => filename);
      for (let index = 0; index < filenames.length; index += chunkSize) {
        count += await loadAndMatch(filenames.slice(index, index + chunkSize));
      }
    } catch (error) {
      handleError(error, $t('errors.repair_unable_to_check_items', { values: { count: 'other' } }));
    } finally {
      checking = false;
    }

    notificationController.show({
      message: $t('admin.repair_matched_items', { values: { count } }),
      type: NotificationType.Info,
    });
  };

  const loadAndMatch = async (filenames: string[]) => {
    const items = await getFileChecksums({
      fileChecksumDto: { filenames },
    });

    let count = 0;

    for (const { checksum, filename } of items) {
      const extra = extras.find((extra) => extra.filename === filename);
      if (extra) {
        extra.checksum = checksum;
        extras = [...extras];
      }

      const orphan = orphans.find((orphan) => orphan.checksum === checksum);
      if (orphan) {
        count++;
        matches = [...matches, { orphan, extra: { filename, checksum } }];
        orphans = orphans.filter((_orphan) => _orphan !== orphan);
        extras = extras.filter((extra) => extra.filename !== filename);
      }
    }

    return count;
  };
</script>

<UserPageLayout title={data.meta.title} admin>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        leadingIcon={mdiWrench}
        onclick={() => handleRepair()}
        disabled={matches.length === 0 || repairing}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.repair_all')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCheckAll}
        onclick={() => handleCheckAll()}
        disabled={extras.length === 0 || checking}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.check_all')}</Text>
      </Button>
      <Button
        leadingIcon={mdiDownload}
        onclick={() => handleDownload()}
        disabled={extras.length + orphans.length === 0}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('export')}</Text>
      </Button>
      <Button leadingIcon={mdiRefresh} onclick={() => handleRefresh()} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('refresh')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      {#if matches.length + extras.length + orphans.length === 0}
        <div class="w-full">
          <EmptyPlaceholder fullWidth text={$t('repair_no_results_message')} src={empty4Url} />
        </div>
      {:else}
        <div class="gap-2">
          <table class="table-fixed mt-5 w-full text-start">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm place-items-center font-medium flex justify-between" colspan="2">
                  <div class="px-3">
                    <p>
                      {$t('matches').toUpperCase()}
                      {matches.length > 0 ? `(${matches.length.toLocaleString($locale)})` : ''}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">{$t('admin.these_files_matched_by_checksum')}</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody
              class="w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg max-h-[500px] block overflow-x-hidden"
            >
              {#each matches as match (match.extra.filename)}
                <tr
                  class="w-full h-[75px] place-items-center border-[3px] border-transparent p-2 odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 flex justify-between"
                  tabindex="0"
                  onclick={() => handleSplit(match)}
                >
                  <td class="text-sm text-ellipsis flex flex-col gap-1 font-mono">
                    <span>{match.orphan.pathValue} =></span>
                    <span>{match.extra.filename}</span>
                  </td>
                  <td class="text-sm text-ellipsis d-flex font-mono">
                    <span>({match.orphan.entityType}/{match.orphan.pathType})</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <table class="table-fixed mt-5 w-full text-start">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-1 md:p-5">
                <th class="w-full text-sm font-medium justify-between place-items-center flex" colspan="2">
                  <div class="px-3">
                    <p>
                      {$t('admin.offline_paths').toUpperCase()}
                      {orphans.length > 0 ? `(${orphans.length.toLocaleString($locale)})` : ''}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">
                      {$t('admin.offline_paths_description')}
                    </p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody
              class="w-full rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg overflow-y-auto max-h-[500px] block overflow-x-hidden"
            >
              {#each orphans as orphan, index (index)}
                <tr
                  class="w-full h-[50px] place-items-center border-[3px] border-transparent odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 flex justify-between"
                  tabindex="0"
                  title={orphan.pathValue}
                >
                  <td onclick={() => copyToClipboard(orphan.pathValue)}>
                    <CircleIconButton title={$t('copy_file_path')} icon={mdiContentCopy} size="18" onclick={() => {}} />
                  </td>
                  <td class="truncate text-sm font-mono text-start" title={orphan.pathValue}>
                    {orphan.pathValue}
                  </td>
                  <td class="text-sm font-mono">
                    <span>({orphan.entityType})</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <table class="table-fixed mt-5 w-full text-start max-h-[300px]">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm font-medium place-items-center flex justify-between" colspan="2">
                  <div class="px-3">
                    <p>
                      {$t('admin.untracked_files').toUpperCase()}
                      {extras.length > 0 ? `(${extras.length.toLocaleString($locale)})` : ''}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">
                      {$t('admin.untracked_files_description')}
                    </p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody
              class="w-full rounded-md border-2 dark:border-immich-dark-gray dark:text-immich-dark-fg overflow-y-auto max-h-[500px] block overflow-x-hidden"
            >
              {#each extras as extra (extra.filename)}
                <tr
                  class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-1 odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 justify-between"
                  tabindex="0"
                  onclick={() => handleCheckOne(extra.filename)}
                  title={extra.filename}
                >
                  <td onclick={() => copyToClipboard(extra.filename)}>
                    <CircleIconButton title={$t('copy_file_path')} icon={mdiContentCopy} size="18" onclick={() => {}} />
                  </td>
                  <td class="w-full text-md text-ellipsis flex justify-between pe-5">
                    <span class="text-ellipsis grow truncate font-mono text-sm pe-5" title={extra.filename}
                      >{extra.filename}</span
                    >
                    <span class="text-sm font-mono dark:text-immich-dark-primary text-immich-primary pes-5">
                      {#if extra.checksum}
                        [sha1:{extra.checksum}]
                      {/if}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </section>
</UserPageLayout>
