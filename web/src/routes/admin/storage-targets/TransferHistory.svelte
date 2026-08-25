<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { StorageTransferDirection, StorageTransferStatus, type StorageTransferResponseDto } from '@immich/sdk';
  import { Badge, Card, CardBody, CardHeader, CardTitle, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    name: string;
    transfers: StorageTransferResponseDto[];
  };

  const { name, transfers }: Props = $props();

  const statusColor = (status: StorageTransferStatus) => {
    switch (status) {
      case StorageTransferStatus.Completed: {
        return 'success';
      }
      case StorageTransferStatus.Failed: {
        return 'danger';
      }
      case StorageTransferStatus.Running: {
        return 'primary';
      }
      default: {
        return 'secondary';
      }
    }
  };

  const formatDate = (value: string | null) =>
    value ? DateTime.fromISO(value).setLocale($locale).toLocaleString(DateTime.DATETIME_MED) : '—';
</script>

<Card>
  <CardHeader>
    <CardTitle>{$t('admin.storage_target_transfers', { values: { name } })}</CardTitle>
  </CardHeader>
  <CardBody>
    <div class="flex flex-col gap-2">
      {#each transfers as transfer (transfer.id)}
        <div class="flex items-center justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
          <div class="flex items-center gap-2">
            <Badge size="small" color="secondary">
              {transfer.direction === StorageTransferDirection.Export
                ? $t('admin.storage_target_export')
                : $t('admin.storage_target_import')}
            </Badge>
            <Badge size="small" color={statusColor(transfer.status)}>{transfer.status}</Badge>
          </div>

          <Text size="small" color="secondary">
            {$t('admin.storage_target_transfer_progress', {
              values: {
                completed: transfer.completedCount,
                total: transfer.totalCount,
                failed: transfer.failedCount,
              },
            })}
          </Text>

          <Text size="small" color="secondary">{formatDate(transfer.startedAt)}</Text>
        </div>

        {#if transfer.error}
          <Text size="tiny" color="danger">{transfer.error}</Text>
        {/if}
      {/each}
    </div>
  </CardBody>
</Card>
