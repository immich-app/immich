<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import MaintenanceBackupsList from '$lib/components/maintenance/MaintenanceBackupsList.svelte';
  import SettingAccordionState from '$lib/components/shared-components/settings/setting-accordion-state.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { QueryParameter } from '$lib/constants';
  import { getMaintenanceAdminActions } from '$lib/services/maintenance.service';
  import { mdiRefresh } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
  const { StartMaintenance } = $derived(getMaintenanceAdminActions($t));
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[StartMaintenance]}>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-212.5">
      <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
        <SettingAccordion
          title={$t('admin.maintenance_restore_database_backup')}
          subtitle={$t('admin.maintenance_restore_database_backup_description')}
          icon={mdiRefresh}
          key="backups"
        >
          <MaintenanceBackupsList backups={data.backups} expectedVersion={data.expectedVersion} />
        </SettingAccordion>
      </SettingAccordionState>
    </section>
  </section>
</AdminPageLayout>
