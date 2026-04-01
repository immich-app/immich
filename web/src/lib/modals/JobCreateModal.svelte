<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { handleCreateJob } from '$lib/services/job.service';
  import { ManualJobName } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = { onClose: () => void };

  let { onClose }: Props = $props();

  const options = [
    { title: $t('admin.person_cleanup_job'), value: ManualJobName.PersonCleanup },
    { title: $t('admin.tag_cleanup_job'), value: ManualJobName.TagCleanup },
    { title: $t('admin.user_cleanup_job'), value: ManualJobName.UserCleanup },
    { title: $t('admin.memory_cleanup_job'), value: ManualJobName.MemoryCleanup },
    { title: $t('admin.memory_generate_job'), value: ManualJobName.MemoryCreate },
    { title: $t('admin.backup_database'), value: ManualJobName.BackupDatabase },
  ].map(({ value, title }) => ({ id: value, label: title, value }));

  let selectedJob: ComboBoxOption | undefined = $state(undefined);

  const onSubmit = async () => {
    if (!selectedJob) {
      return;
    }

    const success = await handleCreateJob({ name: selectedJob.value as ManualJobName });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('admin.create_job')} submitText={$t('create')} disabled={!selectedJob} {onClose} {onSubmit}>
  <Combobox bind:selectedOption={selectedJob} label={$t('jobs')} {options} placeholder={$t('admin.search_jobs')} />
</FormModal>
