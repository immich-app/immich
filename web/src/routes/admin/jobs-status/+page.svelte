<script lang="ts">
  import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
  import { asyncTimeout } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { createJob, getAllJobsStatus, ManualJobName, type AllJobStatusResponseDto } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiCog, mdiPlus } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let jobs: AllJobStatusResponseDto | undefined = $state();

  let running = true;
  let isOpen = $state(false);
  let selectedJob: ComboBoxOption | undefined = $state(undefined);

  onMount(async () => {
    while (running) {
      jobs = await getAllJobsStatus();
      await asyncTimeout(5000);
    }
  });

  onDestroy(() => {
    running = false;
  });

  const options = [
    { title: $t('admin.person_cleanup_job'), value: ManualJobName.PersonCleanup },
    { title: $t('admin.tag_cleanup_job'), value: ManualJobName.TagCleanup },
    { title: $t('admin.user_cleanup_job'), value: ManualJobName.UserCleanup },
    { title: $t('admin.memory_cleanup_job'), value: ManualJobName.MemoryCleanup },
    { title: $t('admin.memory_generate_job'), value: ManualJobName.MemoryCreate },
    { title: $t('admin.backup_database'), value: ManualJobName.BackupDatabase },
  ].map(({ value, title }) => ({ id: value, label: title, value }));

  const handleCancel = () => (isOpen = false);

  const handleCreate = async () => {
    if (!selectedJob) {
      return;
    }

    try {
      await createJob({ jobCreateDto: { name: selectedJob.value as ManualJobName } });
      notificationController.show({ message: $t('admin.job_created'), type: NotificationType.Info });
      handleCancel();
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleCreate();
  };
</script>

<UserPageLayout title={data.meta.title} admin>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button leadingIcon={mdiPlus} onclick={() => (isOpen = true)} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('admin.create_job')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCog}
        href="{AppRoute.ADMIN_SETTINGS}?isOpen=job"
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.manage_concurrency')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      {#if jobs}
        <JobsPanel {jobs} />
      {/if}
    </section>
  </section>
</UserPageLayout>

{#if isOpen}
  <ConfirmDialog
    confirmColor="primary"
    title={$t('admin.create_job')}
    disabled={!selectedJob}
    onConfirm={handleCreate}
    onCancel={handleCancel}
  >
    {#snippet promptSnippet()}
      <form {onsubmit} autocomplete="off" id="create-tag-form" class="w-full">
        <div class="flex flex-col gap-1 text-left">
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
{/if}
