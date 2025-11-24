<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import type { WorkflowPayload } from '$lib/services/workflow.service';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createWorkflow,
    deleteWorkflow,
    PluginTriggerType,
    updateWorkflow,
    type PluginActionResponseDto,
    type PluginFilterResponseDto,
    type PluginResponseDto,
    type WorkflowResponseDto,
  } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeBlock,
    HStack,
    Icon,
    IconButton,
    MenuItemType,
    menuManager,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiCodeJson, mdiDelete, mdiDotsVertical, mdiPause, mdiPencil, mdiPlay, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let workflows = $state<WorkflowResponseDto[]>(data.workflows);
  const expandedWorkflows = new SvelteSet<string>();

  const pluginFilterLookup = new SvelteMap<string, PluginFilterResponseDto & { pluginTitle: string }>();
  const pluginActionLookup = new SvelteMap<string, PluginActionResponseDto & { pluginTitle: string }>();

  for (const plugin of data.plugins as PluginResponseDto[]) {
    for (const filter of plugin.filters ?? []) {
      pluginFilterLookup.set(filter.id, { ...filter, pluginTitle: plugin.title });
    }

    for (const action of plugin.actions ?? []) {
      pluginActionLookup.set(action.id, { ...action, pluginTitle: plugin.title });
    }
  }

  const toggleExpanded = (id: string) => {
    if (expandedWorkflows.has(id)) {
      expandedWorkflows.delete(id);
    } else {
      expandedWorkflows.add(id);
    }
  };

  const buildShareableWorkflow = (workflow: WorkflowResponseDto): WorkflowPayload => {
    const orderedFilters = [...(workflow.filters ?? [])].sort((a, b) => a.order - b.order);
    const orderedActions = [...(workflow.actions ?? [])].sort((a, b) => a.order - b.order);

    return {
      name: workflow.name ?? '',
      description: workflow.description ?? '',
      enabled: workflow.enabled,
      triggerType: workflow.triggerType,
      filters: orderedFilters.map((wfFilter) => {
        const meta = pluginFilterLookup.get(wfFilter.filterId);
        const key = meta?.methodName ?? wfFilter.filterId;
        return {
          [key]: wfFilter.filterConfig ?? {},
        };
      }),
      actions: orderedActions.map((wfAction) => {
        const meta = pluginActionLookup.get(wfAction.actionId);
        const key = meta?.methodName ?? wfAction.actionId;
        return {
          [key]: wfAction.actionConfig ?? {},
        };
      }),
    };
  };

  const getWorkflowJson = (workflow: WorkflowResponseDto) => JSON.stringify(buildShareableWorkflow(workflow), null, 2);

  const handleToggleEnabled = async (workflow: WorkflowResponseDto) => {
    try {
      const updated = await updateWorkflow({
        id: workflow.id,
        workflowUpdateDto: { enabled: !workflow.enabled },
      });
      workflows = workflows.map((w) => (w.id === updated.id ? updated : w));
      toastManager.success($t('workflow_updated'));
    } catch (error) {
      // @ts-expect-error - translation type issue
      handleError(error, $t('errors.unable_to_update') as string);
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowResponseDto) => {
    try {
      await deleteWorkflow({ id: workflow.id });
      workflows = workflows.filter((w) => w.id !== workflow.id);
      toastManager.success($t('workflow_deleted'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete') as string);
    }
  };

  const handleEditWorkflow = async (workflow: WorkflowResponseDto) => {
    await goto(`${AppRoute.WORKFLOWS_EDIT}/${workflow.id}?editMode=visual`);
  };

  const handleCreateWorkflow = async () => {
    const workflow = await createWorkflow({
      workflowCreateDto: {
        name: 'New workflow',
        triggerType: PluginTriggerType.AssetCreate,
        filters: [],
        actions: [],
        enabled: false,
      },
    });

    await goto(`${AppRoute.WORKFLOWS_EDIT}/${workflow.id}?editMode=visual`);
  };

  type WorkflowChip = {
    id: string;
    title: string;
    subtitle: string;
  };

  const getFilterChips = (workflow: WorkflowResponseDto): WorkflowChip[] => {
    return [...(workflow.filters ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((filter) => {
        const meta = pluginFilterLookup.get(filter.filterId);
        return {
          id: filter.id,
          title: meta?.title ?? $t('filter'),
          subtitle: meta?.pluginTitle ?? $t('workflow'),
        };
      });
  };

  const getActionChips = (workflow: WorkflowResponseDto): WorkflowChip[] => {
    return [...(workflow.actions ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((action) => {
        const meta = pluginActionLookup.get(action.actionId);
        return {
          id: action.id,
          title: meta?.title ?? $t('action'),
          subtitle: meta?.pluginTitle ?? $t('workflow'),
        };
      });
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      AssetCreate: $t('asset_created'),
      PersonRecognized: $t('person_recognized'),
    };
    return labels[triggerType] || triggerType;
  };

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formatTimestamp = (iso?: string) => {
    if (!iso) {
      return '—';
    }
    return dateFormatter.format(new Date(iso));
  };

  type WorkflowWithMeta = {
    workflow: WorkflowResponseDto;
    filterChips: WorkflowChip[];
    actionChips: WorkflowChip[];
    workflowJson: string;
  };

  const getWorkflowsWithMeta = (): WorkflowWithMeta[] =>
    workflows.map((workflow) => ({
      workflow,
      filterChips: getFilterChips(workflow),
      actionChips: getActionChips(workflow),
      workflowJson: getWorkflowJson(workflow),
    }));
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button size="small" variant="ghost" color="secondary" onclick={handleCreateWorkflow}>
        <Icon icon={mdiPlus} size="18" />
        {$t('create_workflow')}
      </Button>
    </HStack>
  {/snippet}

  <section class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-4xl">
      {#if workflows.length === 0}
        <div class="flex flex-col items-center justify-center gap-4 py-20">
          <Icon icon={mdiPlay} size="64" class="text-immich-primary dark:text-immich-dark-primary" />
          <h2 class="text-2xl font-semibold">{$t('no_workflows_yet')}</h2>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400">
            {$t('workflows_help_text')}
          </p>
          <Button shape="round" color="primary" onclick={handleCreateWorkflow}>
            <Icon icon={mdiPlus} size="18" />
            {$t('create_first_workflow')}
          </Button>
        </div>
      {:else}
        <div class="my-6 grid gap-6">
          {#each getWorkflowsWithMeta() as { workflow, filterChips, actionChips, workflowJson } (workflow.id)}
            <Card class="border border-gray-200/70 shadow-xl shadow-gray-900/5 dark:border-gray-700/60">
              <CardHeader
                class={`flex flex-col px-8 py-6 gap-4 sm:flex-row sm:items-center sm:gap-6 ${workflow.enabled ? 'bg-linear-to-r from-green-50 to-white dark:from-green-950/40 dark:to-gray-900' : 'bg-neutral-50 dark:bg-neutral-900'}`}
              >
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <span class={workflow.enabled ? 'relative flex h-3 w-3' : 'flex h-3 w-3'}>
                      {#if workflow.enabled}
                        <span class="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      {/if}
                      <span
                        class={workflow.enabled
                          ? 'relative inline-flex h-3 w-3 rounded-full bg-green-500'
                          : 'relative inline-flex h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600'}
                      ></span>
                    </span>
                    <CardTitle>{workflow.name}</CardTitle>
                  </div>
                  <CardDescription class="mt-1 text-sm">
                    {workflow.description || $t('workflows_help_text')}
                  </CardDescription>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <Text size="tiny" class="text-gray-500 dark:text-gray-400">{$t('created_at')}</Text>
                    <Text size="small" class="font-medium">
                      {formatTimestamp(workflow.createdAt)}
                    </Text>
                  </div>
                  <IconButton
                    shape="round"
                    variant="ghost"
                    color="secondary"
                    icon={mdiDotsVertical}
                    aria-label={$t('menu')}
                    onclick={(event: MouseEvent) => {
                      void menuManager.show({
                        target: event.currentTarget as HTMLElement,
                        position: 'top-left',
                        items: [
                          {
                            title: workflow.enabled ? $t('disable') : $t('enable'),
                            color: workflow.enabled ? 'warning' : 'success',
                            icon: workflow.enabled ? mdiPause : mdiPlay,
                            onSelect: () => void handleToggleEnabled(workflow),
                          },
                          {
                            title: $t('edit'),
                            icon: mdiPencil,
                            onSelect: () => void handleEditWorkflow(workflow),
                          },

                          {
                            title: expandedWorkflows.has(workflow.id) ? $t('hide_json') : $t('show_json'),
                            icon: mdiCodeJson,
                            onSelect: () => toggleExpanded(workflow.id),
                          },
                          MenuItemType.Divider,
                          {
                            title: $t('delete'),
                            icon: mdiDelete,
                            color: 'danger',
                            onSelect: () => void handleDeleteWorkflow(workflow),
                          },
                        ],
                      });
                    }}
                  />
                </div>
              </CardHeader>

              <CardBody class="space-y-6">
                <div class="grid gap-4 md:grid-cols-3">
                  <!-- Trigger Section -->
                  <div
                    class="rounded-2xl border border-gray-100/80 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <dt class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      {$t('trigger')}
                    </dt>
                    <span
                      class="inline-block rounded-xl border border-gray-200/80 bg-white/70 px-3 py-1.5 text-sm font-medium shadow-sm dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                    >
                      {getTriggerLabel(workflow.triggerType)}
                    </span>
                  </div>

                  <!-- Filters Section -->
                  <div
                    class="rounded-2xl border border-gray-100/80 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div class="mb-3 flex items-center justify-between">
                      <dt class="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {$t('filter')}
                      </dt>
                      <dd
                        class="rounded-full bg-gray-200 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {workflow.filters.length}
                      </dd>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      {#if filterChips.length === 0}
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                          {$t('no_filters_added')}
                        </span>
                      {:else}
                        {#each filterChips as chip (chip.id)}
                          <span
                            class="rounded-xl border border-gray-200/80 bg-white/70 px-3 py-1.5 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700/80"
                          >
                            <span class="font-medium text-gray-900 dark:text-white">{chip.title}</span>
                          </span>
                        {/each}
                      {/if}
                    </div>
                  </div>

                  <!-- Actions Section -->
                  <div
                    class="rounded-2xl border border-gray-100/80 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div class="mb-3 flex items-center justify-between">
                      <dt class="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {$t('actions')}
                      </dt>
                      <dd
                        class="rounded-full bg-gray-200 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {workflow.actions.length}
                      </dd>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      {#if actionChips.length === 0}
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                          {$t('no_actions_added')}
                        </span>
                      {:else}
                        {#each actionChips as chip (chip.id)}
                          <span
                            class="rounded-xl border border-gray-200/80 bg-white/70 px-3 py-1.5 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700/80"
                          >
                            <span class="font-medium text-gray-900 dark:text-white">{chip.title}</span>
                          </span>
                        {/each}
                      {/if}
                    </div>
                  </div>
                </div>

                {#if expandedWorkflows.has(workflow.id)}
                  <div>
                    <p class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Workflow JSON</p>
                    <CodeBlock code={workflowJson} />
                  </div>
                {/if}
              </CardBody>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
  </section>
</UserPageLayout>
