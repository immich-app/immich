<script lang="ts">
  import HeaderButton from '$lib/components/HeaderButton.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import JobsPanel from '$lib/components/QueuePanel.svelte';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { getQueuesActions } from '$lib/services/queue.service';
  import { handleError } from '$lib/utils/handle-error';
  import { QueueCommand, runQueueCommandLegacy, type QueueResponseDto } from '@immich/sdk';
  import { Button, CommandPaletteContext, HStack, Text, type ActionItem } from '@immich/ui';
  import { mdiPlay } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  onMount(() => queueManager.listen());

  let queues = $derived<QueueResponseDto[]>(queueManager.queues);
  const pausedQueues = $derived(queues.filter(({ isPaused }) => isPaused).map(({ name }) => name));

  const handleResumePausedJobs = async () => {
    try {
      for (const name of pausedQueues) {
        await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Resume, force: false } });
      }
      await queueManager.refresh();
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: 'resume', job: 'paused jobs' } }));
    }
  };

  const { CreateJob, ManageConcurrency } = $derived(getQueuesActions($t));
  const commands: ActionItem[] = $derived([CreateJob, ManageConcurrency]);

  const onQueueUpdate = (update: QueueResponseDto) => {
    queues = queues.map((queue) => {
      if (queue.name === update.name) {
        return update;
      }
      return queue;
    });
  };
</script>

<CommandPaletteContext {commands} />

<OnEvents {onQueueUpdate} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  {#snippet buttons()}
    <HStack gap={0}>
      {#if pausedQueues.length > 0}
        <Button
          leadingIcon={mdiPlay}
          onclick={handleResumePausedJobs}
          size="small"
          variant="ghost"
          title={pausedQueues.join(', ')}
        >
          <Text class="hidden md:block">
            {$t('resume_paused_jobs', { values: { count: pausedQueues.length } })}
          </Text>
        </Button>
      {/if}
      <HeaderButton action={CreateJob} />
      <HeaderButton action={ManageConcurrency} />
    </HStack>
  {/snippet}

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-212.5">
      {#if queues}
        <JobsPanel {queues} />
      {/if}
    </section>
  </section>
</AdminPageLayout>
