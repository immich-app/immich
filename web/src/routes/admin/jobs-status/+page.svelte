<script lang="ts">
  import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
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
  import { mdiCog, mdiPlus } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  export let data: PageData;

  let jobs: AllJobStatusResponseDto;

  let running = true;
  let isOpen = false;
  let selectedJob: ComboBoxOption | undefined = undefined;

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
</script>

<UserPageLayout title={data.meta.title} admin>
  <div class="flex justify-end" slot="buttons">
    <LinkButton on:click={() => (isOpen = true)}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiPlus} size="18" />
        {$t('admin.create_job')}
      </div>
    </LinkButton>
    <LinkButton href="{AppRoute.ADMIN_SETTINGS}?isOpen=job">
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiCog} size="18" />
        {$t('admin.manage_concurrency')}
      </div>
    </LinkButton>
  </div>
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
    <form on:submit|preventDefault={handleCreate} autocomplete="off" id="create-tag-form" slot="prompt" class="w-full">
      <div class="flex flex-col gap-1 text-left">
        <Combobox
          bind:selectedOption={selectedJob}
          label={$t('jobs')}
          {options}
          placeholder={$t('admin.search_jobs')}
        />
      </div>
    </form>
  </ConfirmDialog>
{/if}
