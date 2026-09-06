<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import InfrastructureStorageLocation from '$lib/components/admin-settings/InfrastructureStorageLocation.svelte';
  import InfrastructureMigrations from '$lib/components/admin-settings/InfrastructureMigrations.svelte';
  import InfrastructureLocalAIServers from '$lib/components/admin-settings/InfrastructureLocalAIServers.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Route } from '$lib/route';
  import { OpenQueryParam } from '$lib/constants';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import { Container, toastManager } from '@immich/ui';
  import {
    getConfig,
    getQueues,
    QueueCommand,
    QueueName,
    runQueueCommandLegacy,
    updateQueue,
    type AdminConfigDto,
    type QueueResponseDto,
    type ServerStorageResponseDto,
  } from '@immich/sdk';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let storage = $state<ServerStorageResponseDto>(data.storage);
  let queues = $state<QueueResponseDto[]>(data.queues);
  let config = $state<AdminConfigDto>(data.config);

  const running = new Set<QueueName>();

  const refreshQueues = async () => {
    queues = await getQueues();
  };

  const queueTitle = (name: QueueName) => {
    const titles: Partial<Record<QueueName, string>> = {
      [QueueName.Migration]: $t('admin.migration_job'),
      [QueueName.StorageTemplateMigration]: $t('admin.storage_template_migration'),
    };
    return titles[name] ?? name;
  };

  const runMigration = async (name: QueueName) => {
    running.add(name);
    try {
      await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Start } });
      toastManager.primary($t('admin.run_migration_started', { values: { job: queueTitle(name) } }));
      await refreshQueues();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    } finally {
      running.delete(name);
    }
  };

  const toggleQueue = async (queue: QueueResponseDto) => {
    try {
      const response = await updateQueue({ name: queue.name, queueUpdateDto: { isPaused: !queue.isPaused } });
      eventManager.emit('QueueUpdate', response);
      await refreshQueues();
      toastManager.primary($t(queue.isPaused ? 'resumed' : 'paused'));
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  const toggleMlEnabled = async (enabled: boolean) => {
    await handleSystemConfigSave({
      machineLearning: { ...systemConfigManager.value.machineLearning, enabled },
    });
    config = await getConfig();
  };

  const updateMlUrls = async (urls: string[]) => {
    await handleSystemConfigSave({
      machineLearning: { ...systemConfigManager.value.machineLearning, urls },
    });
    config = await getConfig();
  };

  const openMlSettings = () => {
    goto(Route.systemSettings({ isOpen: OpenQueryParam.MACHINE_LEARNING }));
  };
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    <div class="my-4 flex flex-col gap-6">
      <h1 class="text-2xl font-medium text-primary">{data.meta.title}</h1>

      <p class="text-sm text-immich-fg/60">{$t('admin.infrastructure_settings_description')}</p>

      <InfrastructureStorageLocation
        {storage}
        onRunStorageTemplateMigration={() => runMigration(QueueName.StorageTemplateMigration)}
        isRunning={running.has(QueueName.StorageTemplateMigration)}
      />

      <InfrastructureMigrations {queues} onRun={runMigration} onToggle={toggleQueue} {running} />

      <InfrastructureLocalAIServers
        enabled={config.machineLearning.enabled}
        urls={config.machineLearning.urls}
        availabilityChecks={config.machineLearning.availabilityChecks}
        disabled={featureFlagsManager.value.configFile}
        onToggleEnabled={toggleMlEnabled}
        onUpdateUrls={updateMlUrls}
        onConfigure={openMlSettings}
      />
    </div>
  </Container>
</AdminPageLayout>
