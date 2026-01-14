<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import QueueGraph from '$lib/components/QueueGraph.svelte';
  import { AppRoute } from '$lib/constants';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { asQueueItem, getQueueActions } from '$lib/services/queue.service';
  import { type QueueResponseDto } from '@immich/sdk';
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

  let queue = $derived(data.queue);

  const { Pause, Resume, Empty, RemoveFailedJobs } = $derived(getQueueActions($t, queue));
  const item = $derived(asQueueItem($t, queue));

  onMount(() => queueManager.listen());

  const onQueueUpdate = (update: QueueResponseDto) => {
    if (update.name === queue.name) {
      queue = update;
    }
  };
</script>

<OnEvents {onQueueUpdate} />

<AdminPageLayout
  breadcrumbs={[{ title: $t('admin.queues'), href: AppRoute.ADMIN_QUEUES }, { title: item.title }]}
  actions={[Pause, Resume, Empty, MenuItemType.Divider, RemoveFailedJobs]}
>
  <div>
    <Container size="large" center>
      <div class="mb-1 mt-4 flex items-center gap-2">
        <Heading tag="h1" size="large">{item.title}</Heading>
        {#if queue.isPaused}
          <Badge color="warning">
            {$t('paused')}
          </Badge>
        {/if}
      </div>
      <Text color="muted" class="mb-4">{item.subtitle}</Text>

      <div class="flex gap-1 mb-4">
        <Badge>{$t('active_count', { values: { count: queue.statistics.active } })}</Badge>
        <Badge>{$t('waiting_count', { values: { count: queue.statistics.waiting } })}</Badge>
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
    </Container>
  </div>
</AdminPageLayout>
