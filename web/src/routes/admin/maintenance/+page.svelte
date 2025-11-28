<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiProgressWrench } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  async function switchToMaintenance() {
    try {
      await setMaintenanceMode({
        setMaintenanceModeDto: {
          action: MaintenanceAction.Start,
        },
      });
    } catch (error) {
      handleError(error, $t('admin.maintenance_start_error'));
    }
  }
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button
        leadingIcon={mdiProgressWrench}
        size="small"
        variant="ghost"
        color="secondary"
        onclick={switchToMaintenance}
      >
        <Text class="hidden md:block">{$t('admin.maintenance_start')}</Text>
      </Button>
    </HStack>
  {/snippet}

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <p class="text-sm dark:text-immich-dark-fg uppercase">{$t('admin.maintenance_integrity_report')}</p>

      <div class="mt-5 hidden justify-between lg:flex gap-4">
        {#each ['orphan_file', 'missing_file', 'checksum_mismatch'] as const as reportType (reportType)}
          <ServerStatisticsCard
            title={$t(`admin.maintenance_integrity_${reportType}`)}
            value={data.integrityReport[reportType]}
          >
            {#snippet footer()}
              <Button
                href={`${AppRoute.ADMIN_MAINTENANCE_INTEGRITY_REPORT + reportType}`}
                size="tiny"
                class="self-end mt-1">View Report</Button
              >
            {/snippet}
          </ServerStatisticsCard>
        {/each}
      </div>
    </section>
  </section>
</AdminPageLayout>
