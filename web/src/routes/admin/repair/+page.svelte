<script lang="ts">
  import empty4Url from '$lib/assets/empty-4.svg';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { downloadManager } from '$lib/stores/download';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { type FileReportItemDto, api, copyToClipboard } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { PageData } from './$types';
  import { mdiWrench, mdiCheckAll, mdiDownload, mdiRefresh, mdiContentCopy } from '@mdi/js';

  export let data: PageData;

  interface UntrackedFile {
    filename: string;
    checksum: string | null;
  }

  interface Match {
    orphan: FileReportItemDto;
    extra: UntrackedFile;
  }

  const normalize = (filenames: string[]) => filenames.map((filename) => ({ filename, checksum: null }));

  let checking = false;
  let repairing = false;

  let orphans: FileReportItemDto[] = data.orphans;
  let extras: UntrackedFile[] = normalize(data.extras);
  let matches: Match[] = [];

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
      await api.auditApi.fixAuditFiles({
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
        message: `Repaired ${matches.length} items`,
      });

      matches = [];
    } catch (error) {
      handleError(error, 'Unable to repair items');
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
      const { data: report } = await api.auditApi.getAuditFiles();

      orphans = report.orphans;
      extras = normalize(report.extras);

      notificationController.show({ message: 'Refreshed', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to load items');
    }
  };

  const handleCheckOne = async (filename: string) => {
    try {
      const matched = await loadAndMatch([filename]);
      if (matched) {
        notificationController.show({ message: `Matched 1 item`, type: NotificationType.Info });
      }
    } catch (error) {
      handleError(error, 'Unable to check item');
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
      handleError(error, 'Unable to check items');
    } finally {
      checking = false;
    }

    notificationController.show({ message: `Matched ${count} items`, type: NotificationType.Info });
  };

  const loadAndMatch = async (filenames: string[]) => {
    const { data: items } = await api.auditApi.getFileChecksums({
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
  <svelte:fragment slot="sidebar" />
  <div class="flex justify-end gap-2" slot="buttons">
    <LinkButton on:click={() => handleRepair()} disabled={matches.length === 0 || repairing}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiWrench} size="18" />
        Repair All
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleCheckAll()} disabled={extras.length === 0 || checking}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiCheckAll} size="18" />
        Check All
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleDownload()} disabled={extras.length + orphans.length === 0}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiDownload} size="18" />
        Export
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleRefresh()}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiRefresh} size="18" />
        Refresh
      </div>
    </LinkButton>
  </div>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      {#if matches.length + extras.length + orphans.length === 0}
        <div class="w-full">
          <EmptyPlaceholder
            fullWidth
            text="Untracked and missing files will show up here"
            alt="Empty report"
            src={empty4Url}
          />
        </div>
      {:else}
        <div class="gap-2">
          <table class="table-fixed mt-5 w-full text-left">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm place-items-center font-medium flex justify-between" colspan="2">
                  <div class="px-3">
                    <p>MATCHES {matches.length > 0 ? `(${matches.length})` : ''}</p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">These files are matched by their checksums</p>
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
                  on:click={() => handleSplit(match)}
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

          <table class="table-fixed mt-5 w-full text-left">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-1 md:p-5">
                <th class="w-full text-sm font-medium justify-between place-items-center flex" colspan="2">
                  <div class="px-3">
                    <p>OFFLINE PATHS {orphans.length > 0 ? `(${orphans.length})` : ''}</p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">
                      These files are the results of manually deletion of the default upload library
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
                  <td on:click={() => copyToClipboard(orphan.pathValue)}>
                    <CircleIconButton icon={mdiContentCopy} size="18" />
                  </td>
                  <td class="truncate text-sm font-mono text-left" title={orphan.pathValue}>
                    {orphan.pathValue}
                  </td>
                  <td class="text-sm font-mono">
                    <span>({orphan.entityType})</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <table class="table-fixed mt-5 w-full text-left max-h-[300px]">
            <thead
              class="mb-4 flex w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm font-medium place-items-center flex justify-between" colspan="2">
                  <div class="px-3">
                    <p>UNTRACKS FILES {extras.length > 0 ? `(${extras.length})` : ''}</p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">
                      These files are not tracked by the application. They can be the results of failed moves,
                      interrupted uploads, or left behind due to a bug
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
                  on:click={() => handleCheckOne(extra.filename)}
                  title={extra.filename}
                >
                  <td on:click={() => copyToClipboard(extra.filename)}>
                    <CircleIconButton icon={mdiContentCopy} size="18" />
                  </td>
                  <td class="w-full text-md text-ellipsis flex justify-between pr-5">
                    <span class="text-ellipsis grow truncate font-mono text-sm pr-5" title={extra.filename}
                      >{extra.filename}</span
                    >
                    <span class="text-sm font-mono dark:text-immich-dark-primary text-immich-primary pr-5">
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
