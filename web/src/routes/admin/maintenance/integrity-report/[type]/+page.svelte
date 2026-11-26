<script lang="ts">
  import AdminPageLayout from '#lib/components/layouts/AdminPageLayout.svelte';
  import IntegrityReportTableItem from '#lib/components/maintenance/integrity/IntegrityReportTableItem.svelte';
  import { getIntegrityReportQuery } from '#lib/queries/integrity-admin.query.ts';
  import { getQueuesLegacyQuery } from '#lib/queries/queue.query.ts';
  import { Route } from '#lib/route.ts';
  import { getIntegrityReportActions } from '#lib/services/integrity.service.ts';
  import { Button, Table, TableBody, TableHeader, TableHeading } from '@immich/ui';
  import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
  import { untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const report = createInfiniteQuery(() => getIntegrityReportQuery(data.type));
  const items = $derived(report.data?.pages.flatMap((page) => page.items) ?? []);
  const queues = createQuery(getQueuesLegacyQuery);
  let expectingUpdate = false;

  $effect(() => {
    if (!queues.dataUpdatedAt) {
      return;
    }

    untrack(() => {
      if (queues.data?.integrityCheck.queueStatus.isActive) {
        expectingUpdate = true;
      } else if (expectingUpdate) {
        expectingUpdate = false;
        void report.refetch();
      }
    });
  });

  const { Download, Delete } = $derived(getIntegrityReportActions($t, data.type));
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.maintenance_settings'), href: Route.systemMaintenance() },
    { title: $t('admin.maintenance_integrity_report') },
    { title: data.meta.title },
  ]}
  actions={[Download, Delete]}
>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-212.5">
      <Table striped spacing="tiny">
        <TableHeader>
          <TableHeading class="w-7/8 text-left">{$t('filename')}</TableHeading>
          <TableHeading class="w-1/8" />
        </TableHeader>

        <TableBody>
          {#each items as { id, path } (id)}
            <IntegrityReportTableItem {id} {path} reportType={data.type} />
          {/each}
        </TableBody>

        {#if report.hasNextPage}
          <tfoot class="mt-4 flex justify-center">
            <Button size="medium" color="secondary" onclick={() => report.fetchNextPage()}>{$t('load_more')}</Button>
          </tfoot>
        {/if}
      </Table>
    </section>
  </section>
</AdminPageLayout>
