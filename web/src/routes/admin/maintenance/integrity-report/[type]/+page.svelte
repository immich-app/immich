<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import IntegrityReportTableItem from '$lib/components/maintenance/integrity/IntegrityReportTableItem.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { AppRoute } from '$lib/constants';
  import { getIntegrityReportActions } from '$lib/services/integrity.service';
  import { asyncTimeout } from '$lib/utils';
  import { getIntegrityReport, getQueuesLegacy, IntegrityReportType } from '@immich/sdk';
  import { Button, Table, TableBody, TableHeader, TableHeading } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

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

  const { Download, Delete } = $derived(getIntegrityReportActions($t, data.type));

  function onIntegrityReportDeleted({ id, type }: { id?: string; type?: IntegrityReportType }) {
    if (type === data.type) {
      integrityReport.items = [];
      integrityReport.nextCursor = undefined;
    } else {
      integrityReport.items = integrityReport.items.filter((report) => report.id !== id);
    }
  }
</script>

<OnEvents {onIntegrityReportDeleted} />

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.maintenance_settings'), href: AppRoute.ADMIN_MAINTENANCE_SETTINGS },
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
          {#each integrityReport.items as { id, path } (id)}
            <IntegrityReportTableItem {id} {path} reportType={data.type} />
          {/each}
        </TableBody>

        {#if integrityReport.nextCursor}
          <tfoot class="flex justify-center mt-4">
            <Button size="medium" color="secondary" onclick={() => loadMore()}>{$t('load_more')}</Button>
          </tfoot>
        {/if}
      </Table>
    </section>
  </section>
</AdminPageLayout>
