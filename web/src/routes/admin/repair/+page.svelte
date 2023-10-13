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
  import { handleError } from '$lib/utils/handle-error';
  import { FileReportItemDto, api } from '@api';
  import CheckAll from 'svelte-material-icons/CheckAll.svelte';
  import Refresh from 'svelte-material-icons/Refresh.svelte';
  import Wrench from 'svelte-material-icons/Wrench.svelte';
  import type { PageData } from './$types';

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
      const filenames = [...extras.filter(({ checksum }) => !checksum).map(({ filename }) => filename)];
      for (let i = 0; i < filenames.length; i += chunkSize) {
        count += await loadAndMatch(filenames.slice(i, i + chunkSize));
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

<UserPageLayout user={data.user} title={data.meta.title} admin>
  <svelte:fragment slot="sidebar" />
  <div class="flex justify-end gap-2" slot="buttons">
    <LinkButton on:click={() => handleRepair()} disabled={matches.length === 0 || repairing}>
      <div class="flex place-items-center gap-2 text-sm">
        <Wrench size="18" />
        Repair All
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleCheckAll()} disabled={extras.length === 0 || checking}>
      <div class="flex place-items-center gap-2 text-sm">
        <CheckAll size="18" />
        Check All
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleRefresh()}>
      <div class="flex place-items-center gap-2 text-sm">
        <Refresh size="18" />
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
        <div class="flex flex-col gap-2">
          <table class="mt-5 w-full text-left">
            <thead
              class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm place-items-center font-medium flex justify-between" colspan="2">
                  <span>Matches (via checksum)</span>
                </th>
              </tr>
            </thead>
            <tbody
              class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
            >
              {#each matches as match (match.extra.filename)}
                <tr
                  class="w-full h-[75px] place-items-center border-[3px] border-transparent p-2 odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 flex justify-between"
                  tabindex="0"
                  on:click={() => handleSplit(match)}
                >
                  <td class="text-md text-ellipsis flex flex-col gap-1">
                    <span>{match.orphan.pathValue} =></span>
                    <span>{match.extra.filename}</span>
                  </td>
                  <td class="text-md text-ellipsis d-flex">
                    <span>({match.orphan.entityType}/{match.orphan.pathType})</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <table class="mt-5 w-full text-left">
            <thead
              class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm font-medium justify-between place-items-center flex" colspan="2">
                  <span>Offline Paths</span>
                  <CircleIconButton logo={Refresh} on:click={() => handleRefresh()} />
                </th>
              </tr>
            </thead>
            <tbody
              class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
            >
              {#each orphans as orphan, index (index)}
                <tr
                  class="w-full h-[50px] place-items-center border-[3px] border-transparent p-2 odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 flex justify-between"
                  tabindex="0"
                >
                  <td class="text-md text-ellipsis">
                    <span>{orphan.pathValue}</span>
                  </td>
                  <td class="text-md text-ellipsis">
                    <span>({orphan.entityType})</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <table class="mt-5 w-full text-left">
            <thead
              class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
            >
              <tr class="flex w-full place-items-center p-2 md:p-5">
                <th class="w-full text-sm font-medium place-items-center flex justify-between" colspan="2">
                  <span>Untracked Files</span>
                </th>
              </tr>
            </thead>
            <tbody
              class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
            >
              {#each extras as extra (extra.filename)}
                <tr
                  class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-2 odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5 justify-between"
                  tabindex="0"
                  on:click={() => handleCheckOne(extra.filename)}
                >
                  <td class="text-md text-ellipsis">{extra.filename}</td>
                  <td class="text-md text-ellipsis">
                    {#if extra.checksum}
                      [sha1:{extra.checksum}]
                    {/if}
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
