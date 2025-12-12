<script lang="ts">
  import JobsPanel from '$lib/components/jobs/JobsPanel.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import JobCreateModal from '$lib/modals/JobCreateModal.svelte';
  import { asyncTimeout } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getQueuesLegacy, QueueCommand, QueueName, runQueueCommandLegacy, type QueuesResponseDto } from '@immich/sdk';
  import { Button, HStack, modalManager, Text } from '@immich/ui';
  import { mdiCog, mdiPlay, mdiPlus } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let jobs: QueuesResponseDto | undefined = $state();

  let running = true;

  const pausedJobs = $derived(
    Object.entries(jobs ?? {})
      .filter(([_, queue]) => queue.queueStatus?.isPaused)
      .map(([name]) => name as QueueName),
  );

  const handleResumePausedJobs = async () => {
    try {
      for (const name of pausedJobs) {
        await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Resume, force: false } });
      }
      // Refresh jobs status immediately after resuming
      jobs = await getQueuesLegacy();
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: 'resume', job: 'paused jobs' } }));
    }
  };

  onMount(async () => {
    while (running) {
      jobs = await getQueuesLegacy();
      await asyncTimeout(5000);
    }
  });

  onDestroy(() => {
    running = false;
  });
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={0}>
      {#if pausedJobs.length > 0}
        <Button
          leadingIcon={mdiPlay}
          onclick={handleResumePausedJobs}
          size="small"
          variant="ghost"
          title={pausedJobs.join(', ')}
        >
          <Text class="hidden md:block">
            {$t('resume_paused_jobs', { values: { count: pausedJobs.length } })}
          </Text>
        </Button>
      {/if}
      <Button
        leadingIcon={mdiPlus}
        onclick={() => modalManager.show(JobCreateModal, {})}
        size="small"
        variant="ghost"
        color="secondary"
      >
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
    <section class="w-full pb-28 sm:w-5/6 md:w-212.5">
      {#if jobs}
        <JobsPanel {jobs} />
      {/if}
    </section>
  </section>
</AdminPageLayout>
