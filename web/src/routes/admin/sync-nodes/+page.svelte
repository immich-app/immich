<script lang="ts">
  import { invalidate } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import { getSyncNodeActions, getSyncNodesActions } from '$lib/services/sync-node.service';
  import { SyncNodeStatus, type SyncNodeResponseDto } from '@immich/sdk';
  import {
    Badge,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    MenuItemType,
    Text,
  } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';
  import PairingList from './PairingList.svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const nodes = $derived(data.nodes);
  const pairings = $derived(data.pairings);

  const onSyncNodeUpdate = () => invalidate('app:sync-nodes');

  const { Create } = $derived(getSyncNodesActions($t));

  const getActionsForNode = (node: SyncNodeResponseDto) => {
    const { Test, Pair, Edit, Delete } = getSyncNodeActions($t, node);
    return [Test, Pair, Edit, MenuItemType.Divider, Delete];
  };

  const statusColor = (status: SyncNodeStatus) =>
    status === SyncNodeStatus.Online ? 'success' : status === SyncNodeStatus.Unknown ? 'secondary' : 'danger';
</script>

<OnEvents {onSyncNodeUpdate} />

<CommandPaletteDefaultProvider name={$t('admin.sync_nodes')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container size="large" center class="my-4">
    <div class="flex flex-col gap-6" in:fade={{ duration: 500 }}>
      <Text size="small" color="secondary">{$t('admin.sync_nodes_description')}</Text>

      {#if nodes.length > 0}
        {#each nodes as node (node.id)}
          <Card>
            <CardHeader>
              <div class="flex w-full items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                  <CardTitle>{node.name}</CardTitle>
                  <span class="font-mono text-xs opacity-70">{node.url}</span>
                </div>

                <div class="flex items-center gap-2">
                  <Badge size="small" color={statusColor(node.status)}>{node.status}</Badge>
                  {#if node.remoteVersion}
                    <Badge size="small" color="secondary">v{node.remoteVersion}</Badge>
                  {/if}
                  {#if !node.isEnabled}
                    <Badge size="small" color="warning">{$t('disabled')}</Badge>
                  {/if}
                  <ContextMenuButton items={getActionsForNode(node)} />
                </div>
              </div>
            </CardHeader>

            <CardBody>
              {#if node.error}
                <Text size="small" color="danger" class="mb-3">{node.error}</Text>
              {/if}

              <PairingList pairings={pairings[node.id] ?? []} />
            </CardBody>
          </Card>
        {/each}
      {:else}
        <EmptyPlaceholder text={$t('admin.sync_nodes_empty')} onClick={() => Create.onAction(Create)} />
      {/if}
    </div>
  </Container>
</AdminPageLayout>
