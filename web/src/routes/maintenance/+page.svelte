<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import MaintenanceRestoreFlow from '$lib/components/maintenance/MaintenanceRestoreFlow.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { handleSetMaintenanceMode } from '$lib/services/maintenance.service';
  import { maintenanceStore } from '$lib/stores/maintenance.store';
  import { MaintenanceAction } from '@immich/sdk';
  import { Button, Heading, Link, ProgressBar, Scrollable, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const { auth, status } = maintenanceStore;

  // strip token from URL after load
  const url = new URL(location.href);
  if (url.searchParams.get('token')) {
    url.searchParams.delete('token');
    history.replaceState({}, document.title, url);
  }

  const end = () =>
    handleSetMaintenanceMode({
      action: MaintenanceAction.End,
    });

  const error = $derived(
    $status?.error
      ?.split('\n')
      .filter((line) => !line.includes('drop cascades'))
      .join('\n'),
  );
</script>

<AuthPageLayout
  withHeader={$status?.action === MaintenanceAction.Start || $status?.action === MaintenanceAction.End}
  withBackdrop={$status?.action === MaintenanceAction.Start}
>
  <div class="flex flex-col place-items-center text-center gap-8">
    {#if $status?.action === MaintenanceAction.RestoreDatabase}
      <Heading size="large" color="primary" tag="h1">{$t('maintenance_action_restore')}</Heading>
      {#if $status.error}
        <Scrollable class="max-h-80">
          <pre class="text-left text-sm"><code>{error}</code></pre>
        </Scrollable>
        <Button onclick={end}>{$t('maintenance_end')}</Button>
      {:else}
        <ProgressBar progress={$status.progress || 0} />
        {#if $status.task === 'backup'}
          <Text>{$t('maintenance_task_backup')}</Text>
        {/if}
        {#if $status.task === 'restore'}
          <Text>{$t('maintenance_task_restore')}</Text>
        {/if}
        {#if $status.task === 'migrations'}
          <Text>{$t('maintenance_task_migrations')}</Text>
        {/if}
        {#if $status.task === 'rollback'}
          <Text>{$t('maintenance_task_rollback')}</Text>
        {/if}
      {/if}
    {:else if $status?.action === MaintenanceAction.SelectDatabaseRestore && $auth}
      <MaintenanceRestoreFlow {end} expectedVersion={data.expectedVersion} />
    {:else}
      <Heading size="large" color="primary" tag="h1">{$t('maintenance_title')}</Heading>
      <p>
        <FormatMessage key="maintenance_description">
          {#snippet children({ tag, message })}
            {#if tag === 'link'}
              <Link href="https://docs.immich.app/administration/maintenance-mode">
                {message}
              </Link>
            {/if}
          {/snippet}
        </FormatMessage>
      </p>
      {#if $auth}
        <p>
          {$t('maintenance_logged_in_as', {
            values: {
              user: $auth.username,
            },
          })}
        </p>
        <Button onclick={end}>{$t('maintenance_end')}</Button>
      {/if}
    {/if}
  </div>
</AuthPageLayout>
