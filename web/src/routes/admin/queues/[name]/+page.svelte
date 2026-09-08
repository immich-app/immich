<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import QueueGraph from './QueueGraph.svelte';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { Route } from '$lib/route';
  import { asQueueItem, getQueueActions } from '$lib/services/queue.service';
  import {
    Badge,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Container,
    Heading,
    Icon,
    MenuItemType,
    Text,
  } from '@immich/ui';
  import { mdiClockTimeTwoOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const queue = $derived(queueManager.queues.find((q) => q.name === data.queue.name) ?? data.queue);
  const failedJobs = $derived(data.failedJobs ?? []);

  const { Pause, Resume, Empty, RemoveFailedJobs } = $derived(getQueueActions($t, queue));
  const item = $derived(asQueueItem($t, queue));

  onMount(() => queueManager.listen());
</script>

<AdminPageLayout
  breadcrumbs={[{ title: $t('admin.queues'), href: Route.queues() }, { title: item.title }]}
  actions={[Pause, Resume, Empty, MenuItemType.Divider, RemoveFailedJobs]}
>
  <div>
    <Container size="large" center>
      <div class="mt-4 mb-1 flex items-center gap-2">
        <Heading tag="h1" size="large">{item.title}</Heading>
        {#if queue.isPaused}
          <Badge color="warning">
            {$t('paused')}
          </Badge>
        {/if}
      </div>
      <Text color="muted" class="mb-4">{item.subtitle}</Text>

      <div class="mb-4 flex gap-1">
        <Badge>{$t('active_count', { values: { count: queue.statistics.active } })}</Badge>
        <Badge>{$t('waiting_count', { values: { count: queue.statistics.waiting + queue.statistics.paused } })}</Badge>
        {#if queue.statistics.failed > 0}
          <Badge color="danger">{$t('failed_count', { values: { count: queue.statistics.failed } })}</Badge>
        {/if}
      </div>

      <div class="mt-8">
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 text-primary">
              <Icon icon={mdiClockTimeTwoOutline} size="1.5rem" />
              <CardTitle>{$t('admin.jobs_over_time')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <QueueGraph {queue} class="h-[300px]" />
          </CardBody>
        </Card>
      </div>

      {#if failedJobs.length > 0}
        <div class="mt-8">
          <Card color="secondary">
            <CardHeader>
              <CardTitle>{$t('admin.jobs_failed_details')}</CardTitle>
            </CardHeader>

            <CardBody>
              <div class="flex flex-col gap-3">
                {#each failedJobs as job (job.id ?? `${job.name}-${job.timestamp}`)}
                  <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div class="flex flex-col gap-1">
                      <div class="font-medium text-primary">{job.name}</div>

                      {#if job.id}
                        <div class="text-xs text-gray-500 dark:text-gray-400">{$t('id')}: {job.id}</div>
                      {/if}
                    </div>

                    {#if job.failedReason}
                      <div class="mt-3 break-words text-sm text-red-600 dark:text-red-400">
                        {$t('admin.job_failed_reason')}: {job.failedReason}
                      </div>
                    {/if}

                    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{$t('admin.job_attempts')}: {job.attemptsMade}</span>

                      <span>{$t('created')}: {new Date(job.timestamp).toLocaleString()}</span>

                      {#if job.processedOn}
                        <span>{$t('admin.job_processed')}: {new Date(job.processedOn).toLocaleString()}</span>
                      {/if}

                      {#if job.finishedOn}
                        <span>{$t('admin.job_finished')}: {new Date(job.finishedOn).toLocaleString()}</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </CardBody>
          </Card>
        </div>
      {/if}
    </Container>
  </div>
</AdminPageLayout>
