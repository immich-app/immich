<script lang="ts">
  import { invalidate } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import {
    getStorageTargetActions,
    getStorageTargetsActions,
    storageTargetKindLabel,
  } from '$lib/services/storage-target.service';
  import { StorageTargetKind, type StorageTargetResponseDto } from '@immich/sdk';
  import {
    Badge,
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    MenuItemType,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
    Text,
  } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';
  import TransferHistory from './TransferHistory.svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const targets = $derived(data.targets);
  const transfers = $derived(data.transfers);

  const onStorageTargetUpdate = () => invalidate('app:storage-targets');

  const { Create } = $derived(getStorageTargetsActions($t));

  const getActionsForTarget = (target: StorageTargetResponseDto) => {
    const { Test, Export, Import, Edit, Delete } = getStorageTargetActions($t, target);
    return [Test, Export, Import, Edit, MenuItemType.Divider, Delete];
  };

  /** Where the target actually points, condensed to one line for the table. */
  const describeLocation = ({ kind, config }: StorageTargetResponseDto) => {
    switch (kind) {
      case StorageTargetKind.S3: {
        return `${config.endpoint || 's3.amazonaws.com'}/${config.bucket}`;
      }
      case StorageTargetKind.Webdav: {
        return config.baseUrl;
      }
      case StorageTargetKind.Local: {
        return config.basePath;
      }
      default: {
        return '';
      }
    }
  };

  const classes = {
    column1: 'w-3/12',
    column2: 'w-2/12',
    column3: 'w-4/12',
    column4: 'w-2/12',
    column5: 'w-1/12 flex justify-end',
  };
</script>

<OnEvents {onStorageTargetUpdate} />

<CommandPaletteDefaultProvider name={$t('admin.storage_targets')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container size="large" center class="my-4">
    <div class="flex flex-col gap-6" in:fade={{ duration: 500 }}>
      <Text size="small" color="secondary">{$t('admin.storage_targets_description')}</Text>

      {#if targets.length > 0}
        <Table striped size="small" spacing="small">
          <TableHeader>
            <TableHeading class={classes.column1}>{$t('name')}</TableHeading>
            <TableHeading class={classes.column2}>{$t('admin.storage_target_kind')}</TableHeading>
            <TableHeading class={classes.column3}>{$t('admin.storage_target_location')}</TableHeading>
            <TableHeading class={classes.column4}>{$t('status')}</TableHeading>
            <TableHeading class={classes.column5}></TableHeading>
          </TableHeader>
          <TableBody>
            {#each targets as target (target.id)}
              <TableRow>
                <TableCell class={classes.column1}>{target.name}</TableCell>
                <TableCell class={classes.column2}>{storageTargetKindLabel($t, target.kind)}</TableCell>
                <TableCell class={classes.column3}>
                  <span class="font-mono text-xs">{describeLocation(target)}</span>
                </TableCell>
                <TableCell class={classes.column4}>
                  <div class="flex gap-1">
                    <Badge color={target.isEnabled ? 'success' : 'secondary'} size="small">
                      {target.isEnabled ? $t('enabled') : $t('disabled')}
                    </Badge>
                    {#if !target.hasCredentials}
                      <Badge color="warning" size="small">{$t('admin.storage_target_no_credentials')}</Badge>
                    {/if}
                  </div>
                </TableCell>
                <TableCell class={classes.column5}>
                  <ContextMenuButton items={getActionsForTarget(target)} />
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>

        {#each targets as target (target.id)}
          {@const targetTransfers = transfers[target.id] ?? []}
          {#if targetTransfers.length > 0}
            <TransferHistory name={target.name} transfers={targetTransfers} />
          {/if}
        {/each}
      {:else}
        <EmptyPlaceholder text={$t('admin.storage_targets_empty')} onClick={() => Create.onAction(Create)} />
      {/if}
    </div>
  </Container>
</AdminPageLayout>
