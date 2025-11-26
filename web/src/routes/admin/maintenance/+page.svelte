<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import MaintenanceBackupsList from '$lib/components/maintenance/MaintenanceBackupsList.svelte';
  import SettingAccordionState from '$lib/components/shared-components/settings/setting-accordion-state.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { QueryParameter } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiProgressWrench, mdiRefresh } from '@mdi/js';
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
      <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
        <SettingAccordion
          title="Restore database backup"
          subtitle="Rollback to an earlier database state using a backup file"
          icon={mdiRefresh}
          key="backups"
        >
          <MaintenanceBackupsList backups={data.backups} />
        </SettingAccordion>
      </SettingAccordionState>
    </section>
  </section>
</AdminPageLayout>
