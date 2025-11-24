<script lang="ts">
  import ActionButton from '$lib/components/ActionButton.svelte';
  import { asQueueItem, getQueueActions, handleViewQueue } from '$lib/services/queue.service';
  import { type QueueResponseDto } from '@immich/sdk';
  import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Icon, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    queue: QueueResponseDto;
  };

  const { queue }: Props = $props();
  const item = $derived(asQueueItem($t, queue));
  const { View, Pause, Resume, ContextMenu } = $derived(getQueueActions($t, queue));
</script>

<Card color="secondary" class="max-w-[750px]">
  <CardHeader>
    <div class="gap-1 items-center flex justify-between">
      <CardTitle class="flex gap-1 items-center text-primary">
        <Icon icon={item.icon} />
        {item.title}
        {#if queue.isPaused}
          <Badge color="warning">{$t('paused')}</Badge>
        {/if}
      </CardTitle>
      <div class="flex gap-1 items-center">
        <ActionButton action={ContextMenu} />
      </div>
    </div>
  </CardHeader>
  <CardBody>
    {#if item.subtitle}
      <Text color="muted">{item.subtitle}</Text>
    {/if}

    <div class="flex gap-1 flex-row my-4">
      <Badge color="primary">
        {$t('active_count', { values: { count: queue.statistics.active } })}
      </Badge>
      <Badge color="info">
        {$t('waiting_count', { values: { count: queue.statistics.paused + queue.statistics.waiting } })}
      </Badge>
      <Badge color="danger">
        {$t('failed_count', { values: { count: queue.statistics.failed } })}
      </Badge>
    </div>
  </CardBody>

  <CardFooter class="flex justify-between items-center gap-2">
    <div class="flex gap-1">
      <Button size="small" color="primary" onclick={() => handleViewQueue(queue)}>Queue all</Button>
      <Button size="small" color="primary" onclick={() => handleViewQueue(queue)}>Queue missing</Button>
    </div>
    <Button color="secondary" onclick={() => handleViewQueue(queue)}>{$t('view')}</Button>
  </CardFooter>
</Card>
