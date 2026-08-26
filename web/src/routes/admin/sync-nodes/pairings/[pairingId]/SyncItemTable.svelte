<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { SyncDirection, type SyncPairingItemDto } from '@immich/sdk';
  import { Badge, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    items: SyncPairingItemDto[];
    maxAttempts: number;
    nodeName: string;
  };

  const { items, maxAttempts, nodeName }: Props = $props();

  const formatDate = (value: string) => DateTime.fromISO(value).setLocale($locale).toRelative();

  const describeDirection = (direction: SyncDirection) =>
    direction === SyncDirection.Push
      ? $t('admin.sync_pairing_item_push', { values: { name: nodeName } })
      : $t('admin.sync_pairing_item_pull', { values: { name: nodeName } });
</script>

<Table striped spacing="tiny">
  <TableHeader>
    <TableHeading class="w-2/5 text-left">{$t('filename')}</TableHeading>
    <TableHeading class="w-1/5 text-left">{$t('admin.sync_pairing_reason')}</TableHeading>
    <TableHeading class="w-1/5 text-left">{$t('admin.sync_pairing_attempts_heading')}</TableHeading>
    <TableHeading class="w-1/5 text-left">{$t('admin.sync_pairing_last_tried')}</TableHeading>
  </TableHeader>

  <TableBody>
    {#each items as item (item.id)}
      <TableRow>
        <TableCell class="px-4 text-left">
          <div class="flex flex-col gap-0.5">
            <!-- A pull has no local asset yet, so the peer's id is all there is to name it by. -->
            <Text size="small" class="break-all">{item.fileName ?? item.assetId}</Text>
            <Text size="tiny" color="secondary">{describeDirection(item.direction)}</Text>
          </div>
        </TableCell>

        <TableCell class="px-4 text-left">
          {#if item.lastError}
            <Text size="tiny" color={item.isStuck ? 'danger' : 'warning'} class="wrap-break-word">{item.lastError}</Text>
          {:else}
            <Text size="tiny" color="secondary">{$t('admin.sync_pairing_item_waiting')}</Text>
          {/if}
        </TableCell>

        <TableCell class="px-4 text-left">
          <Badge size="small" color={item.isStuck ? 'danger' : item.attempts > 0 ? 'warning' : 'secondary'}>
            {$t('admin.sync_pairing_attempts', { values: { count: item.attempts, max: maxAttempts } })}
          </Badge>
        </TableCell>

        <TableCell class="px-4 text-left">
          <Text size="tiny" color="secondary">{formatDate(item.updatedAt)}</Text>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
