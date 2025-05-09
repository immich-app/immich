<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { createJob, ManualJobName } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  type Props = { onClose: (confirmed: boolean) => void };

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

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleCreate();
  };

  const handleCreate = async () => {
    if (!selectedJob) {
      return;
    }

    try {
      await createJob({ jobCreateDto: { name: selectedJob.value as ManualJobName } });
      notificationController.show({ message: $t('admin.job_created'), type: NotificationType.Info });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  };
</script>

<ConfirmDialog
  confirmColor="primary"
  title={$t('admin.create_job')}
  disabled={!selectedJob}
  onClose={(confirmed) => (confirmed ? handleCreate() : onClose(false))}
>
  {#snippet promptSnippet()}
    <form {onsubmit} autocomplete="off" id="create-tag-form" class="w-full">
      <div class="flex flex-col gap-1 text-start">
        <Combobox
          bind:selectedOption={selectedJob}
          label={$t('jobs')}
          {options}
          placeholder={$t('admin.search_jobs')}
        />
      </div>
    </form>
  {/snippet}
</ConfirmDialog>
