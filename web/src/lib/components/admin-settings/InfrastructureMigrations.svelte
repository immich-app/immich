<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import { Badge, Button, Link, Text } from '@immich/ui';
  import { QueueName, type QueueResponseDto } from '@immich/sdk';
  import { Route } from '$lib/route';
  import { mdiFileMove, mdiFolderMove, mdiPause, mdiPlay } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    queues: QueueResponseDto[];
    onRun: (name: QueueName) => void;
    onToggle: (queue: QueueResponseDto) => void;
    running: Set<QueueName>;
  }

  let { queues, onRun, onToggle, running }: Props = $props();

  const queueTitles: Partial<Record<QueueName, string>> = $derived({
    [QueueName.Migration]: $t('admin.migration_job'),
    [QueueName.StorageTemplateMigration]: $t('admin.storage_template_migration'),
  });

  const foundQueues = $derived.by(() => {
    const map = new Map(queues.map((queue) => [queue.name, queue]));
    const names: QueueName[] = [QueueName.Migration, QueueName.StorageTemplateMigration];
    return names.map((name) => ({ name, queue: map.get(name) })).filter((entry) => entry.queue !== undefined) as Array<{
      name: QueueName;
      queue: QueueResponseDto;
    }>;
  });
</script>

<SettingAccordion
  key="infrastructure-migrations"
  title={$t('admin.infrastructure_migrations')}
  subtitle={$t('admin.infrastructure_migrations_description')}
  icon={mdiFolderMove}
>
  <div class="ms-4 mt-4 flex flex-col gap-4">
    {#if foundQueues.length === 0}
      <Text size="small" class="text-immich-fg/60">{$t('admin.infrastructure_no_migration_queues')}</Text>
    {/if}

    {#each foundQueues as { name, queue } (name)}
      <div class="flex flex-col gap-2">
        <div class="flex place-items-center justify-between">
          <div>
            <Text fontWeight="medium">{queueTitles[name]}</Text>
            <Text size="small" class="text-immich-fg/60">{$t('admin.migration_job_description')}</Text>
          </div>
          {#if queue.isPaused}
            <Badge color="warning">{$t('paused')}</Badge>
          {:else if queue.statistics.active > 0}
            <Badge color="info">{$t('active')}</Badge>
          {:else}
            <Badge color="success">{$t('admin.infrastructure_idle')}</Badge>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <Button
            leadingIcon={queue.isPaused ? mdiPlay : mdiPause}
            size="small"
            shape="round"
            variant="ghost"
            onclick={() => onToggle(queue)}
          >
            {queue.isPaused ? $t('resume') : $t('pause')}
          </Button>
          <Button
            leadingIcon={mdiFileMove}
            size="small"
            shape="round"
            loading={running.has(name)}
            onclick={() => onRun(name)}
          >
            {$t('admin.run_migration')}
          </Button>
        </div>
      </div>
      {#if name !== foundQueues[foundQueues.length - 1].name}
        <hr />
      {/if}
    {/each}

    <Text size="small" class="text-immich-fg/60">
      <Link href={Route.queues()}>{$t('admin.infrastructure_manage_queues')}</Link>
    </Text>
  </div>
</SettingAccordion>
