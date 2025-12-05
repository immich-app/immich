<script lang="ts">
  import emptyWorkflows from '$lib/assets/empty-workflows.svg';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    getWorkflowActions,
    getWorkflowShowSchemaAction,
    handleCreateWorkflow,
    type WorkflowPayload,
  } from '$lib/services/workflow.service';
  import type { PluginFilterResponseDto, WorkflowResponseDto } from '@immich/sdk';
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
    VStack,
  } from '@immich/ui';
  import { mdiClose, mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let workflows = $state<WorkflowResponseDto[]>(data.workflows);

  const expandedWorkflows = new SvelteSet<string>();

  const pluginFilterLookup = new SvelteMap<string, PluginFilterResponseDto>();
  const pluginActionLookup = new SvelteMap<string, PluginFilterResponseDto>();

  for (const plugin of data.plugins) {
    for (const filter of plugin.filters ?? []) {
      pluginFilterLookup.set(filter.id, { ...filter });
    }

    for (const action of plugin.actions ?? []) {
      pluginActionLookup.set(action.id, { ...action });
    }
  }

  const toggleShowingSchema = (id: string) => {
    if (expandedWorkflows.has(id)) {
      expandedWorkflows.delete(id);
    } else {
      expandedWorkflows.add(id);
    }
  };

  const constructPayload = (workflow: WorkflowResponseDto): WorkflowPayload => {
    const orderedFilters = [...(workflow.filters ?? [])].sort((a, b) => a.order - b.order);
    const orderedActions = [...(workflow.actions ?? [])].sort((a, b) => a.order - b.order);

    return {
      name: workflow.name ?? '',
      description: workflow.description ?? '',
      enabled: workflow.enabled,
      triggerType: workflow.triggerType,
      filters: orderedFilters.map((filter) => {
        const meta = pluginFilterLookup.get(filter.pluginFilterId);
        const key = meta?.methodName ?? filter.pluginFilterId;
        return {
          [key]: filter.filterConfig ?? {},
        };
      }),
      actions: orderedActions.map((action) => {
        const meta = pluginActionLookup.get(action.pluginActionId);
        const key = meta?.methodName ?? action.pluginActionId;
        return {
          [key]: action.actionConfig ?? {},
        };
      }),
    };
  };

  const getJson = (workflow: WorkflowResponseDto) => JSON.stringify(constructPayload(workflow), null, 2);

  const onWorkflowUpdate = (updatedWorkflow: WorkflowResponseDto) => {
    workflows = workflows.map((currentWorkflow) =>
      currentWorkflow.id === updatedWorkflow.id ? updatedWorkflow : currentWorkflow,
    );
  };

  const onWorkflowDelete = (deletedWorkflow: WorkflowResponseDto) => {
    workflows = workflows.filter((currentWorkflow) => currentWorkflow.id !== deletedWorkflow.id);
  };

  const getFilterLabel = (filterId: string) => {
    const meta = pluginFilterLookup.get(filterId);
    return meta?.title ?? $t('filter');
  };

  const getActionLabel = (actionId: string) => {
    const meta = pluginActionLookup.get(actionId);
    return meta?.title ?? $t('action');
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      AssetCreate: $t('asset_created'),
      PersonRecognized: $t('person_recognized'),
    };
    return labels[triggerType] || triggerType;
  };

  const formatTimestamp = (createdAt: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(createdAt));

  const showWorkflowMenu = (event: MouseEvent, workflow: WorkflowResponseDto) => {
    const { ToggleEnabled, Edit, Delete } = getWorkflowActions($t, workflow);
    void menuManager.show({
      target: event.currentTarget as HTMLElement,
      position: 'top-left',
      items: [
        ToggleEnabled,
        Edit,
        getWorkflowShowSchemaAction($t, expandedWorkflows.has(workflow.id), () => toggleShowingSchema(workflow.id)),
        MenuItemType.Divider,
        Delete,
      ],
    });
  };
</script>

<OnEvents {onWorkflowUpdate} {onWorkflowDelete} />

{#snippet chipItem(title: string)}
  <span class="rounded-xl border border-gray-200/80 px-3 py-1.5 text-sm dark:border-gray-600 bg-light">
    <span class="font-medium text-dark">{title}</span>
  </span>
{/snippet}

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
        <EmptyPlaceholder
          title={$t('create_first_workflow')}
          text={$t('workflows_help_text')}
          onClick={handleCreateWorkflow}
          src={emptyWorkflows}
          class="mt-10 mx-auto"
        />
      {:else}
        <div class="my-6 grid gap-6">
          {#each workflows as workflow (workflow.id)}
            <Card class="border border-light-200">
              <CardHeader
                class={`flex flex-row px-8 py-6 gap-4 sm:items-center sm:gap-6 ${
                  workflow.enabled
                    ? 'bg-linear-to-r from-green-50 to-white dark:from-green-800/50 dark:to-green-950/45'
                    : 'bg-neutral-50 dark:bg-neutral-900'
                }`}
              >
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <span
                      class="rounded-full {workflow.enabled ? 'h-3 w-3 bg-success' : 'h-3 w-3 rounded-full bg-muted'}"
                    ></span>
                    <CardTitle>{workflow.name}</CardTitle>
                  </div>
                  <CardDescription class="mt-1 text-sm">
                    {workflow.description || $t('workflows_help_text')}
                  </CardDescription>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right hidden sm:block">
                    <Text size="tiny">{$t('created_at')}</Text>
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
                    onclick={(event: MouseEvent) => showWorkflowMenu(event, workflow)}
                  />
                </div>
              </CardHeader>

              <CardBody class="space-y-6">
                <div class="grid gap-4 md:grid-cols-3">
                  <!-- Trigger Section -->
                  <div class="rounded-2xl border p-4 bg-light-50 border-light-200">
                    <div class="mb-3">
                      <Text class="text-xs font-semibold uppercase tracking-widest" color="muted">{$t('trigger')}</Text>
                    </div>
                    {@render chipItem(getTriggerLabel(workflow.triggerType))}
                  </div>

                  <!-- Filters Section -->
                  <div class="rounded-2xl border p-4 bg-light-50 border-light-200">
                    <div class="mb-3">
                      <Text class="text-xs font-semibold uppercase tracking-widest" color="muted">{$t('filters')}</Text>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      {#if workflow.filters.length === 0}
                        <span class="text-sm text-light-600">
                          {$t('no_filters_added')}
                        </span>
                      {:else}
                        {#each workflow.filters as workflowFilter (workflowFilter.id)}
                          {@render chipItem(getFilterLabel(workflowFilter.pluginFilterId))}
                        {/each}
                      {/if}
                    </div>
                  </div>

                  <!-- Actions Section -->
                  <div class="rounded-2xl border p-4 bg-light-50 border-light-200">
                    <div class="mb-3">
                      <Text class="text-xs font-semibold uppercase tracking-widest" color="muted">{$t('actions')}</Text>
                    </div>

                    <div>
                      {#if workflow.actions.length === 0}
                        <span class="text-sm text-light-600">
                          {$t('no_actions_added')}
                        </span>
                      {:else}
                        <div class="flex flex-wrap gap-2">
                          {#each workflow.actions as workflowAction (workflowAction.id)}
                            {@render chipItem(getActionLabel(workflowAction.pluginActionId))}
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>

                {#if expandedWorkflows.has(workflow.id)}
                  <VStack gap={2} class="w-full rounded-2xl border bg-light-50 p-4 border-light-200 ">
                    <CodeBlock code={getJson(workflow)} lineNumbers />
                    <Button
                      leadingIcon={mdiClose}
                      fullWidth
                      variant="ghost"
                      color="secondary"
                      onclick={() => toggleShowingSchema(workflow.id)}>{$t('close')}</Button
                    >
                  </VStack>
                {/if}
              </CardBody>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
  </section>
</UserPageLayout>
