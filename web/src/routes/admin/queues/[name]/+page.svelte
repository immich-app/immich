<script lang="ts">
  import HeaderButton from '$lib/components/HeaderButton.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import QueueGraph from '$lib/components/QueueGraph.svelte';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { asQueueItem, getQueueActions } from '$lib/services/queue.service';
  import { locale } from '$lib/stores/preferences.store';
  import { type QueueResponseDto } from '@immich/sdk';
  import {
    AnnouncementBanner,
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Container,
    Heading,
    HStack,
    Icon,
    Text,
  } from '@immich/ui';
  import { mdiClockTimeTwoOutline, mdiConsoleLine, mdiSync, mdiTrashCanOutline, mdiViewList } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let queue = $derived(data.queue);
  let failedJobs = $derived(data.failedJobs);

  const { Pause, Resume, Empty } = $derived(getQueueActions($t, queue));
  const item = $derived(asQueueItem($t, queue));

  onMount(() => {
    return queueManager.listen();
  });

  const onQueueUpdate = (update: QueueResponseDto) => {
    if (update.name === queue.name) {
      queue = update;
    }
  };
</script>

<OnEvents {onQueueUpdate} />

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={0}>
      <HeaderButton action={Pause} />
      <HeaderButton action={Resume} />
      <HeaderButton action={Empty} />
    </HStack>
  {/snippet}
  <div>
    <Container size="large" center>
      {#if queue.isPaused}
        <AnnouncementBanner color="warning" class="mt-4 w-full rounded"
          >The queue is currently paused</AnnouncementBanner
        >
      {/if}

      <Heading tag="h1" size="large" class="mb-1 mt-4">{item.title}</Heading>
      <Text color="muted" class="mb-4">{item.subtitle}</Text>

      <div class="flex gap-1 mb-4">
        <Badge>{$t('active_count', { values: { count: queue.statistics.active } })}</Badge>
        <Badge>{$t('waiting_count', { values: { count: queue.statistics.waiting } })}</Badge>
        {#if queue.statistics.failed > 0}
          <Badge color="danger">{$t('failed_count', { values: { count: queue.statistics.failed } })}</Badge>
        {/if}
      </div>

      <div class="mt-2">
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 text-primary">
              <Icon icon={mdiClockTimeTwoOutline} size="1.5rem" />
              <CardTitle>Jobs over time</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <QueueGraph {queue} class="max-h-[200px]" />
          </CardBody>
        </Card>
      </div>

      <div class="mt-4">
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 text-primary">
              <Icon icon={mdiViewList} size="1.5rem" />
              <CardTitle>{$t('admin.failed_jobs')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            {#if failedJobs.length === 0}
              <Text color="muted">{$t('admin.no_failed_jobs')}</Text>
            {/if}

            <div class="flex flex-col gap-1 w-full">
              {#each failedJobs.slice(0, 100) as job, i (i)}
                <div class="bg-subtle flex justify-between w-full {i > 0 ? 'border-b' : ''}">
                  <div class="flex flex-col gap-1 w-full">
                    <Text>{job.name} (ID: {job.id})</Text>
                    <Text color="muted" variant="italic"
                      >Failed on {new Date(job.raw.timestamp).toLocaleString($locale, {
                        dateStyle: 'short',
                        timeStyle: 'long',
                      })}</Text
                    >

                    <div class="flex gap-1 justify-end">
                      <Button leadingIcon={mdiSync} color="secondary" size="small" variant="ghost">Retry job</Button>
                      <Button leadingIcon={mdiSync} color="secondary" size="small" variant="ghost">View job data</Button
                      >
                      <Button leadingIcon={mdiConsoleLine} color="secondary" size="small" variant="ghost"
                        >View logs</Button
                      >
                      <Button leadingIcon={mdiTrashCanOutline} color="danger" size="small">Delete</Button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  </div>
</AdminPageLayout>
