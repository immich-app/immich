<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getSyncPairingActions } from '$lib/services/sync-node.service';
  import { type SyncPairingResponseDto } from '@immich/sdk';
  import { Badge, ContextMenuButton, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    pairings: SyncPairingResponseDto[];
  };

  const { pairings }: Props = $props();

  const formatDate = (value: string | null) =>
    value ? DateTime.fromISO(value).setLocale($locale).toRelative() : $t('admin.sync_pairing_never_synced');

  const getActions = (pairing: SyncPairingResponseDto) => {
    const { SyncNow, Unpair } = getSyncPairingActions($t, pairing);
    return [SyncNow, Unpair];
  };
</script>

{#if pairings.length === 0}
  <Text size="small" color="secondary">{$t('admin.sync_pairings_empty')}</Text>
{:else}
  <div class="flex flex-col gap-2">
    {#each pairings as pairing (pairing.id)}
      <div class="flex items-center justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
        <div class="flex flex-col gap-0.5">
          <Text size="small">{pairing.remoteUserEmail}</Text>
          <div class="flex gap-1">
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
        </div>

        <div class="flex items-center gap-3">
          {#if pairing.stuckCount > 0}
            <Badge size="small" color="danger">
              {$t('admin.sync_pairing_stuck', { values: { count: pairing.stuckCount } })}
            </Badge>
          {/if}
          {#if pairing.pendingCount > 0}
            <Badge size="small" color="warning">
              {$t('admin.sync_pairing_pending', { values: { count: pairing.pendingCount } })}
            </Badge>
          {/if}
          {#if pairing.error}
            <Text size="tiny" color="danger">{pairing.error}</Text>
          {:else}
            <Text size="tiny" color="secondary">{formatDate(pairing.lastSyncedAt)}</Text>
          {/if}
          <ContextMenuButton items={getActions(pairing)} />
        </div>
      </div>
    {/each}
  </div>
{/if}
