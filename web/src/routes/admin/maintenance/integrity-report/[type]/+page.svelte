<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteIntegrityReportFile, getBaseUrl, IntegrityReportType } from '@immich/sdk';
  import {
    Button,
    HStack,
    IconButton,
    menuManager,
    modalManager,
    Text,
    type ContextMenuBaseProps,
    type MenuItems,
  } from '@immich/ui';
  import { mdiDotsVertical, mdiDownload, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let deleting = new SvelteSet();
  let integrityReport = $state(data.integrityReport.items);

  async function remove(id: string) {
    const confirm = await modalManager.showDialog({
      confirmText: $t('delete'),
    });

    if (confirm) {
      try {
        deleting.add(id);
        await deleteIntegrityReportFile({
          id,
        });
        integrityReport = integrityReport.filter((report) => report.id !== id);
      } catch (error) {
        handleError(error, 'Failed to delete file!');
      } finally {
        deleting.delete(id);
      }
    }
  }

  function download(reportId: string) {
    location.href = `${getBaseUrl()}/admin/maintenance/integrity/report/${reportId}/file`;
  }

  const handleOpen = async (event: Event, props: Partial<ContextMenuBaseProps>, reportId: string) => {
    const items: MenuItems = [];

    if (data.type === IntegrityReportType.OrphanFile || data.type === IntegrityReportType.ChecksumMismatch) {
      items.push({
        title: $t('download'),
        icon: mdiDownload,
        onAction() {
          void download(reportId);
        },
      });
    }

    if (data.type === IntegrityReportType.OrphanFile) {
      items.push({
        title: $t('delete'),
        icon: mdiTrashCanOutline,
        color: 'danger',
        onAction() {
          void remove(reportId);
        },
      });
    }

    await menuManager.show({
      ...props,
      target: event.currentTarget as HTMLElement,
      items,
    });
  };
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.maintenance_settings'), href: AppRoute.ADMIN_MAINTENANCE_SETTINGS },
    { title: $t('admin.maintenance_integrity_report') },
    { title: data.meta.title },
  ]}
>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button
        size="small"
        variant="ghost"
        color="secondary"
        href={`${getBaseUrl()}/admin/maintenance/integrity/report/${data.type}/csv`}
      >
        <Text class="hidden md:block">Download CSV</Text>
      </Button>
    </HStack>
  {/snippet}

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
        <tbody
          class="block max-h-80 w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
        >
          {#each integrityReport as { id, path } (id)}
            <tr
              class={`flex py-1 w-full place-items-center even:bg-subtle/20 odd:bg-subtle/80 ${deleting.has(id) ? 'text-gray-500' : ''}`}
            >
              <td class="w-7/8 text-ellipsis text-left px-2 text-sm select-all">{path}</td>
              <td class="w-1/8 text-ellipsis text-right flex justify-end px-2">
                <IconButton
                  color="secondary"
                  icon={mdiDotsVertical}
                  variant="ghost"
                  onclick={(event: Event) => handleOpen(event, { position: 'top-right' }, id)}
                  aria-label={$t('open')}
                  disabled={deleting.has(id)}
                /></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  </section>
</AdminPageLayout>
