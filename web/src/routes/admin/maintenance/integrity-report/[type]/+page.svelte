<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { asyncTimeout } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createJob,
    deleteIntegrityReport,
    getBaseUrl,
    getIntegrityReport,
    getQueuesLegacy,
    IntegrityReportType,
    ManualJobName,
  } from '@immich/sdk';
  import {
    Button,
    HStack,
    IconButton,
    menuManager,
    modalManager,
    toastManager,
    type ContextMenuBaseProps,
    type MenuItems,
  } from '@immich/ui';
  import { mdiDotsVertical, mdiDownload, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let deleting = new SvelteSet();
  let integrityReport = $state(data.integrityReport);

  async function loadMore() {
    const { items, nextCursor } = await getIntegrityReport({
      integrityGetReportDto: {
        type: data.type,
        cursor: integrityReport.nextCursor,
      },
    });

    integrityReport.items.push(...items);
    integrityReport.nextCursor = nextCursor;
  }

  async function removeAll() {
    const confirm = await modalManager.showDialog({
      confirmText: $t('delete'),
    });

    if (confirm) {
      let name: ManualJobName;
      switch (data.type) {
        case IntegrityReportType.UntrackedFile: {
          name = ManualJobName.IntegrityUntrackedFilesDeleteAll;
          break;
        }
        case IntegrityReportType.MissingFile: {
          name = ManualJobName.IntegrityMissingFilesDeleteAll;
          break;
        }
        case IntegrityReportType.ChecksumMismatch: {
          name = ManualJobName.IntegrityChecksumMismatchDeleteAll;
          break;
        }
      }

      try {
        deleting.add('all');
        await createJob({ jobCreateDto: { name } });
        toastManager.success($t('admin.job_created'));
      } catch (error) {
        handleError(error, $t('failed_to_delete_file'));
      }
    }
  }

  async function remove(id: string) {
    const confirm = await modalManager.showDialog({
      confirmText: $t('delete'),
    });

    if (confirm) {
      try {
        deleting.add(id);
        await deleteIntegrityReport({
          id,
        });
        integrityReport.items = integrityReport.items.filter((report) => report.id !== id);
      } catch (error) {
        handleError(error, $t('failed_to_delete_file'));
      } finally {
        deleting.delete(id);
      }
    }
  }

  function download(reportId: string) {
    location.href = `${getBaseUrl()}/admin/integrity/report/${reportId}/file`;
  }

  const handleOpen = async (event: Event, props: Partial<ContextMenuBaseProps>, reportId: string) => {
    const items: MenuItems = [];

    if (data.type === IntegrityReportType.UntrackedFile || data.type === IntegrityReportType.ChecksumMismatch) {
      items.push({
        title: $t('download'),
        icon: mdiDownload,
        onAction() {
          void download(reportId);
        },
      });
    }

    await menuManager.show({
      ...props,
      target: event.currentTarget as HTMLElement,
      items: [
        ...items,
        {
          title: $t('delete'),
          icon: mdiTrashCanOutline,
          color: 'danger',
          onAction() {
            void remove(reportId);
          },
        },
      ],
    });
  };

  let running = true;
  let expectingUpdate = false;

  onMount(async () => {
    while (running) {
      const jobs = await getQueuesLegacy();
      if (jobs.integrityCheck.queueStatus.isActive) {
        expectingUpdate = true;
      } else if (expectingUpdate) {
        integrityReport = await getIntegrityReport({
          integrityGetReportDto: {
            type: data.type,
          },
        });
        expectingUpdate = false;
      }

      await asyncTimeout(2000);
    }
  });

  onDestroy(() => {
    running = false;
  });
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.maintenance_settings'), href: AppRoute.ADMIN_MAINTENANCE_SETTINGS },
    { title: $t('admin.maintenance_integrity_report') },
    { title: data.meta.title },
  ]}
  actions={[
    {
      title: $t('admin.download_csv'),
      icon: mdiDownload,
      onAction: () => {
        location.href = `${getBaseUrl()}/admin/maintenance/integrity/report/${data.type}/csv`;
      },
    },
    {
      title: $t('trash_page_delete_all'),
      onAction: removeAll,
      icon: mdiTrashCanOutline,
    },
  ]}
>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <table class="mt-5 w-full text-start">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-7/8 text-left px-2 text-sm font-medium">{$t('filename')}</th>
            <th class="w-1/8"></th>
          </tr>
        </thead>
        <tbody class="block w-full rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg">
          {#each integrityReport.items as { id, path } (id)}
            <tr
              class={`flex py-1 w-full place-items-center even:bg-subtle/20 odd:bg-subtle/80 ${deleting.has(id) || deleting.has('all') ? 'text-gray-500' : ''}`}
            >
              <td class="w-7/8 text-ellipsis text-left px-2 text-sm select-all">{path}</td>
              <td class="w-1/8 text-ellipsis text-right flex justify-end px-2">
                <IconButton
                  color="secondary"
                  icon={mdiDotsVertical}
                  variant="ghost"
                  onclick={(event: Event) => handleOpen(event, { position: 'top-right' }, id)}
                  aria-label={$t('open')}
                  disabled={deleting.has(id) || deleting.has('all')}
                /></td
              >
            </tr>
          {/each}
        </tbody>
        {#if integrityReport.nextCursor}
          <tfoot>
            <HStack class="mt-4 items-center justify-center">
              <Button color="primary" onclick={() => loadMore()}>{$t('load_more')}</Button>
            </HStack>
          </tfoot>
        {/if}
      </table>
    </section>
  </section>
</AdminPageLayout>
