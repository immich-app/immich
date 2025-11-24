<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import QueueCard from '$lib/components/QueueCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import JobCreateModal from '$lib/modals/JobCreateModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { QueueCommand, runQueueCommandLegacy, type QueueResponseDto } from '@immich/sdk';
  import { Button, Container, HStack, modalManager, Text } from '@immich/ui';
  import { mdiCog, mdiPlay, mdiPlus } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let queues = $derived<QueueResponseDto[]>(queueManager.queues);

  onMount(() => {
    return queueManager.listen();
  });

  const pausedJobs = $derived(queues.filter(({ isPaused }) => isPaused).map(({ name }) => name));

  const handleResumePausedJobs = async () => {
    try {
      for (const name of pausedJobs) {
        await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Resume, force: false } });
      }
      await queueManager.refresh();
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: 'resume', job: 'paused jobs' } }));
    }
  };

  const onQueueUpdate = (update: QueueResponseDto) => {
    queues = queues.map((queue) => {
      if (queue.name === update.name) {
        return update;
      }
      return queue;
    });
  };
</script>

<OnEvents {onQueueUpdate} />

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

  <Container size="large" center>
    <div class="flex flex-col gap-2">
      {#each queues as queue (queue.name)}
        <QueueCard {queue} />
      {/each}
    </div>
  </Container>
</AdminPageLayout>
