<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Route } from '$lib/route';
  import { getSyncPairingActions, handleRetryStuckItem, handleRetryStuckItems } from '$lib/services/sync-node.service';
  import { locale } from '$lib/stores/preferences.store';
  import {
    getSyncPairing,
    getSyncPairingItems,
    QueueName,
    SyncItemFilter,
    type SyncPairingItemDto,
    type SyncPairingItemsResponseDto,
    type SyncPairingResponseDto,
  } from '@immich/sdk';
  import {
    Badge,
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    Container,
    Heading,
    ProgressBar,
    Text,
  } from '@immich/ui';
  import { mdiRestart } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';
  import { ITEM_LIMIT } from './constants';
  import SyncItemTable from './SyncItemTable.svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  /** Often enough to watch a transfer move, rarely enough to be cheap. */
  const REFRESH_INTERVAL_MS = 5000;

  let polled = $state<{
    id: string;
    pairing: SyncPairingResponseDto;
    active: SyncPairingItemsResponseDto;
    stuck: SyncPairingItemsResponseDto;
  }>();

  // A poll only speaks for the pairing it was made against, so moving to another
  // one falls back to what that page loaded until the next tick lands.
  const current = $derived(polled?.id === data.pairing.id ? polled : data);

  const pairing = $derived(current.pairing);
  const active = $derived(current.active);
  const stuck = $derived(current.stuck);
  const node = $derived(data.node);

  const refresh = async () => {
    const { id } = data.pairing;

    try {
      const [pairing, active, stuck] = await Promise.all([
        getSyncPairing({ id }),
        getSyncPairingItems({ id, filter: SyncItemFilter.Active, size: ITEM_LIMIT }),
        getSyncPairingItems({ id, filter: SyncItemFilter.Stuck, size: ITEM_LIMIT }),
      ]);

      polled = { id, pairing, active, stuck };
    } catch {
      // A failed tick leaves the last good numbers on screen; the next one tries again.
    }
  };

  // Requeuing moves rows between the two tables, so the page is refreshed at once
  // rather than leaving the old split on screen until the next tick.
  const retryAll = async () => {
    if (await handleRetryStuckItems(pairing)) {
      await refresh();
    }
  };

  const retryOne = async (item: SyncPairingItemDto) => {
    if (await handleRetryStuckItem(pairing, item)) {
      await refresh();
    }
  };

  onMount(() => {
    const stopListening = queueManager.listen();
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      stopListening();
    };
  });

  const { SyncNow, Unpair } = $derived(getSyncPairingActions($t, pairing));

  // Items that have never failed. The rest of what is outstanding is either being
  // retried or has run out of attempts.
  const waitingCount = $derived(Math.max(pairing.pendingCount - pairing.retryingCount - pairing.stuckCount, 0));
  const knownCount = $derived(pairing.syncedCount + pairing.pendingCount);
  const syncedPercent = $derived(knownCount === 0 ? 100 : Math.round((pairing.syncedCount / knownCount) * 100));

  // The queue is per server rather than per pairing, so this says what the whole
  // node sync worker pool is doing, not what this pairing alone is doing.
  const queue = $derived(queueManager.queues.find(({ name }) => name === QueueName.NodeSync));

  const configDisabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const lastSynced = $derived(
    pairing.lastSyncedAt
      ? DateTime.fromISO(pairing.lastSyncedAt).setLocale($locale).toRelative()
      : $t('admin.sync_pairing_never_synced'),
  );
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.sync_nodes'), href: Route.syncNodes() },
    { title: node.name },
    { title: pairing.remoteUserEmail },
  ]}
  actions={[SyncNow, Unpair]}
>
  <Container size="large" center class="my-4">
    <div class="flex flex-col gap-6" in:fade={{ duration: 500 }}>
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <Heading tag="h1" size="large">{pairing.remoteUserEmail}</Heading>
          {#if pairing.pushEnabled}
            <Badge size="small" color="primary">{$t('admin.sync_pairing_push')}</Badge>
          {/if}
          {#if pairing.pullEnabled}
            <Badge size="small" color="primary">{$t('admin.sync_pairing_pull')}</Badge>
          {/if}
          {#if !pairing.pushEnabled && !pairing.pullEnabled}
            <Badge size="small" color="secondary">{$t('admin.sync_pairing_paused')}</Badge>
          {/if}
        </div>
        <Text size="small" color="secondary">{$t('admin.sync_pairing_details_description')}</Text>
      </div>

      {#if pairing.error}
        <Text size="small" color="danger">{pairing.error}</Text>
      {/if}

      <Card>
        <CardHeader>
          <CardTitle>{$t('admin.sync_pairing_progress')}</CardTitle>
          <CardDescription>
            {$t('admin.sync_pairing_synced_of_total', {
              values: { synced: pairing.syncedCount, total: knownCount },
            })}
          </CardDescription>
        </CardHeader>

        <CardBody>
          <ProgressBar value={syncedPercent} max={100} color="primary" valueLabel={`${syncedPercent}%`} />

          <div class="mt-4 flex flex-wrap gap-6">
            <div class="flex flex-col">
              <Text size="large">{pairing.syncedCount}</Text>
              <Text size="tiny" color="secondary">{$t('admin.sync_pairing_stat_synced')}</Text>
            </div>
            <div class="flex flex-col">
              <Text size="large">{waitingCount}</Text>
              <Text size="tiny" color="secondary">{$t('admin.sync_pairing_stat_waiting')}</Text>
            </div>
            <div class="flex flex-col">
              <Text size="large" color={pairing.retryingCount > 0 ? 'warning' : undefined}>
                {pairing.retryingCount}
              </Text>
              <Text size="tiny" color="secondary">{$t('admin.sync_pairing_stat_retrying')}</Text>
            </div>
            <div class="flex flex-col">
              <Text size="large" color={pairing.stuckCount > 0 ? 'danger' : undefined}>{pairing.stuckCount}</Text>
              <Text size="tiny" color="secondary">{$t('admin.sync_pairing_stat_stuck')}</Text>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-0.5">
            {#if queue}
              <Text size="small">
                {$t('admin.sync_pairing_in_flight', {
                  values: {
                    running: queue.statistics.active,
                    waiting: queue.statistics.waiting + queue.statistics.paused,
                  },
                })}
              </Text>
              <Text size="tiny" color="secondary">{$t('admin.sync_pairing_in_flight_shared')}</Text>
            {/if}
            <Text size="tiny" color="secondary">
              {$t('admin.sync_pairing_last_synced', { values: { date: lastSynced } })}
            </Text>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{$t('admin.sync_pairing_workers')}</CardTitle>
          <CardDescription>{$t('admin.sync_pairing_workers_description')}</CardDescription>
        </CardHeader>

        <CardBody>
          <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              disabled={configDisabled}
              label={$t('admin.sync_pairing_workers')}
              description=""
              min={1}
              required={true}
              bind:value={configToEdit.job.nodeSync.concurrency}
              isEdited={configToEdit.job.nodeSync.concurrency !== config.job.nodeSync.concurrency}
            />

            <SettingButtonsRow bind:configToEdit keys={['job']} disabled={configDisabled} />
          </form>
        </CardBody>
      </Card>

      {#if stuck.total > 0}
        <Card>
          <CardHeader>
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="flex flex-col gap-1">
                <CardTitle>
                  <span class="text-danger">{$t('admin.sync_pairing_items_needs_attention')}</span>
                </CardTitle>
                <CardDescription>
                  {$t('admin.sync_pairing_items_needs_attention_description', { values: { count: stuck.maxAttempts } })}
                </CardDescription>
              </div>

              <Button size="small" shape="round" leadingIcon={mdiRestart} onclick={() => void retryAll()}>
                {$t('admin.sync_pairing_retry_all')}
              </Button>
            </div>
          </CardHeader>

          <CardBody>
            <SyncItemTable
              items={stuck.items}
              maxAttempts={stuck.maxAttempts}
              nodeName={node.name}
              onRetry={(item) => void retryOne(item)}
            />
            {#if stuck.total > stuck.items.length}
              <Text size="tiny" color="secondary" class="mt-2">
                {$t('admin.sync_pairing_items_truncated', {
                  values: { count: stuck.items.length, total: stuck.total },
                })}
              </Text>
            {/if}
          </CardBody>
        </Card>
      {/if}

      <Card>
        <CardHeader>
          <CardTitle>{$t('admin.sync_pairing_items_in_progress')}</CardTitle>
          <CardDescription>{$t('admin.sync_pairing_items_in_progress_description')}</CardDescription>
        </CardHeader>

        <CardBody>
          {#if active.items.length === 0}
            <Text size="small" color="secondary">{$t('admin.sync_pairing_items_empty')}</Text>
          {:else}
            <SyncItemTable items={active.items} maxAttempts={active.maxAttempts} nodeName={node.name} />
            {#if active.total > active.items.length}
              <Text size="tiny" color="secondary" class="mt-2">
                {$t('admin.sync_pairing_items_truncated', {
                  values: { count: active.items.length, total: active.total },
                })}
              </Text>
            {/if}
          {/if}
        </CardBody>
      </Card>
    </div>
  </Container>
</AdminPageLayout>
