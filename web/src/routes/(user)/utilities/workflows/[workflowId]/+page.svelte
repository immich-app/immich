<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { dragAndDrop } from '$lib/actions/drag-and-drop';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import SchemaFormFields from '$lib/components/workflows/SchemaFormFields.svelte';
  import WorkflowCardConnector from '$lib/components/workflows/WorkflowCardConnector.svelte';
  import WorkflowJsonEditor from '$lib/components/workflows/WorkflowJsonEditor.svelte';
  import WorkflowSummarySidebar from '$lib/components/workflows/WorkflowSummary.svelte';
  import WorkflowTriggerCard from '$lib/components/workflows/WorkflowTriggerCard.svelte';
  import { AppRoute } from '$lib/constants';
  import AddWorkflowStepModal from '$lib/modals/AddWorkflowStepModal.svelte';
  import WorkflowNavigationConfirmModal from '$lib/modals/WorkflowNavigationConfirmModal.svelte';
  import WorkflowTriggerUpdateConfirmModal from '$lib/modals/WorkflowTriggerUpdateConfirmModal.svelte';
  import {
    buildWorkflowPayload,
    getActionsByContext,
    getFiltersByContext,
    handleUpdateWorkflow,
    hasWorkflowChanged,
    initializeActionConfigs,
    initializeFilterConfigs,
    parseWorkflowJson,
    type WorkflowPayload,
  } from '$lib/services/workflow.service';
  import { handleError } from '$lib/utils/handle-error';
  import type { PluginActionResponseDto, PluginFilterResponseDto, PluginTriggerResponseDto } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    Container,
    Field,
    HStack,
    Icon,
    Input,
    Switch,
    Text,
    Textarea,
    VStack,
    modalManager,
    toastManager,
  } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiCodeJson,
    mdiContentSave,
    mdiFilterOutline,
    mdiFlashOutline,
    mdiInformationOutline,
    mdiPlayCircleOutline,
    mdiPlus,
    mdiTrashCanOutline,
    mdiViewDashboard,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const triggers = data.triggers;
  const filters = data.plugins.flatMap((plugin) => plugin.filters);
  const actions = data.plugins.flatMap((plugin) => plugin.actions);

  let previousWorkflow = data.workflow;
  let editWorkflow = $state(data.workflow);

  let viewMode: 'visual' | 'json' = $state('visual');

  let name: string = $derived(editWorkflow.name ?? '');
  let description: string = $derived(editWorkflow.description ?? '');

  let selectedTrigger = $state(triggers.find((t) => t.type === editWorkflow.triggerType) ?? triggers[0]);

  let triggerType = $derived(selectedTrigger.type);

  let supportFilters = $derived(getFiltersByContext(filters, selectedTrigger.contextType));
  let supportActions = $derived(getActionsByContext(actions, selectedTrigger.contextType));

  let selectedFilters: PluginFilterResponseDto[] = $derived(
    (editWorkflow.filters ?? []).flatMap((workflowFilter) =>
      supportFilters.filter((supportedFilter) => supportedFilter.id === workflowFilter.pluginFilterId),
    ),
  );

  let selectedActions: PluginActionResponseDto[] = $derived(
    (editWorkflow.actions ?? []).flatMap((workflowAction) =>
      supportActions.filter((supportedAction) => supportedAction.id === workflowAction.pluginActionId),
    ),
  );

  let filterConfigs: Record<string, unknown> = $derived(initializeFilterConfigs(editWorkflow, supportFilters));
  let actionConfigs: Record<string, unknown> = $derived(initializeActionConfigs(editWorkflow, supportActions));

  $effect(() => {
    editWorkflow.triggerType = triggerType;
  });

  // Clear filters and actions when trigger changes (context changes)
  let previousContext = $state<string | undefined>(undefined);
  $effect(() => {
    const currentContext = selectedTrigger.contextType;
    if (previousContext !== undefined && previousContext !== currentContext) {
      selectedFilters = [];
      selectedActions = [];
      filterConfigs = {};
      actionConfigs = {};
    }
    previousContext = currentContext;
  });

  const updateWorkflow = async () => {
    try {
      const updated = await handleUpdateWorkflow(
        editWorkflow.id,
        name,
        description,
        editWorkflow.enabled,
        triggerType,
        selectedFilters,
        selectedActions,
        filterConfigs,
        actionConfigs,
      );

      // Update the previous workflow state to the new values
      previousWorkflow = updated;
      editWorkflow = updated;

      toastManager.success($t('workflow_update_success'), {
        closable: true,
      });
    } catch (error) {
      handleError(error, 'Failed to update workflow');
    }
  };

  const jsonContent = $derived(
    buildWorkflowPayload(
      name,
      description,
      editWorkflow.enabled,
      triggerType,
      selectedFilters,
      selectedActions,
      filterConfigs,
      actionConfigs,
    ),
  );

  let jsonEditorContent: WorkflowPayload = $state({
    name: '',
    description: '',
    enabled: false,
    triggerType: '',
    filters: [],
    actions: [],
  });

  const syncFromJson = () => {
    const result = parseWorkflowJson(JSON.stringify(jsonEditorContent), triggers, filters, actions);

    if (!result.success) {
      return;
    }

    if (result.data) {
      name = result.data.name;
      description = result.data.description;
      editWorkflow.enabled = result.data.enabled;

      if (result.data.trigger) {
        selectedTrigger = result.data.trigger;
      }

      selectedFilters = result.data.filters;
      selectedActions = result.data.actions;
      filterConfigs = result.data.filterConfigs;
      actionConfigs = result.data.actionConfigs;
    }
  };

  let hasChanges: boolean = $derived(
    hasWorkflowChanged(
      previousWorkflow,
      editWorkflow.enabled,
      name,
      description,
      triggerType,
      selectedFilters,
      selectedActions,
      filterConfigs,
      actionConfigs,
      filters,
      actions,
    ),
  );

  // Drag and drop handlers
  let draggedFilterIndex: number | null = $state(null);
  let draggedActionIndex: number | null = $state(null);
  let dragOverFilterIndex: number | null = $state(null);
  let dragOverActionIndex: number | null = $state(null);

  const handleFilterDragStart = (index: number) => {
    draggedFilterIndex = index;
  };

  const handleFilterDragEnter = (index: number) => {
    if (draggedFilterIndex !== null && draggedFilterIndex !== index) {
      dragOverFilterIndex = index;
    }
  };

  const handleFilterDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFilterIndex === null || draggedFilterIndex === index) {
      return;
    }

    const newFilters = [...selectedFilters];
    const [draggedItem] = newFilters.splice(draggedFilterIndex, 1);
    newFilters.splice(index, 0, draggedItem);
    selectedFilters = newFilters;
  };

  const handleFilterDragEnd = () => {
    draggedFilterIndex = null;
    dragOverFilterIndex = null;
  };

  const handleActionDragStart = (index: number) => {
    draggedActionIndex = index;
  };

  const handleActionDragEnter = (index: number) => {
    if (draggedActionIndex !== null && draggedActionIndex !== index) {
      dragOverActionIndex = index;
    }
  };

  const handleActionDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (draggedActionIndex === null || draggedActionIndex === index) {
      return;
    }

    const newActions = [...selectedActions];
    const [draggedItem] = newActions.splice(draggedActionIndex, 1);
    newActions.splice(index, 0, draggedItem);
    selectedActions = newActions;
  };

  const handleActionDragEnd = () => {
    draggedActionIndex = null;
    dragOverActionIndex = null;
  };

  const handleAddStep = async (type?: 'action' | 'filter') => {
    const result = (await modalManager.show(AddWorkflowStepModal, {
      filters: supportFilters,
      actions: supportActions,
      type,
    })) as { type: 'filter' | 'action'; item: PluginFilterResponseDto | PluginActionResponseDto } | undefined;

    if (result) {
      if (result.type === 'filter') {
        selectedFilters = [...selectedFilters, result.item as PluginFilterResponseDto];
      } else if (result.type === 'action') {
        selectedActions = [...selectedActions, result.item as PluginActionResponseDto];
      }
    }
  };

  const handleRemoveFilter = (index: number) => {
    selectedFilters = selectedFilters.filter((_, i) => i !== index);
  };

  const handleRemoveAction = (index: number) => {
    selectedActions = selectedActions.filter((_, i) => i !== index);
  };

  const handleTriggerChange = async (newTrigger: PluginTriggerResponseDto) => {
    const confirmed = await modalManager.show(WorkflowTriggerUpdateConfirmModal);

    if (!confirmed) {
      return;
    }

    selectedTrigger = newTrigger;
  };

  let allowNavigation = $state(false);

  beforeNavigate(({ cancel, to }) => {
    if (hasChanges && !allowNavigation) {
      cancel();

      modalManager
        .show(WorkflowNavigationConfirmModal)
        .then((isConfirmed) => {
          if (isConfirmed && to) {
            allowNavigation = true;
            void goto(to.url);
          }
        })
        .catch(() => {});
    }
  });
</script>

{#snippet cardOrder(index: number)}
  <div class="h-8 w-8 rounded-lg flex place-items-center place-content-center shrink-0 border">
    <Text size="small" class="font-mono font-bold">
      {index + 1}
    </Text>
  </div>
{/snippet}

{#snippet stepSeparator()}
  <div class="relative flex justify-center py-4">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div class="w-full border-t-2 border-dashed border-light-200"></div>
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-white dark:bg-black px-2 font-semibold text-light-500">THEN</span>
    </div>
  </div>
{/snippet}

{#snippet emptyCreateButton(title: string, description: string, onclick: () => Promise<void>)}
  <button
    type="button"
    {onclick}
    class="w-full p-8 rounded-lg border-2 border-dashed hover:border-light-400 hover:bg-light-50 transition-all flex flex-col items-center justify-center gap-2"
  >
    <Icon icon={mdiPlus} size="32" />
    <Text size="small" class="font-medium">{title}</Text>
    <Text size="tiny">{description}</Text>
  </button>
{/snippet}

<svelte:head>
  <title>{data.meta.title} - Immich</title>
</svelte:head>

<main class="pt-24 immich-scrollbar">
  <Container size="medium" class="p-4" center>
    {#if viewMode === 'json'}
      <WorkflowJsonEditor
        jsonContent={jsonEditorContent}
        onApply={syncFromJson}
        onContentChange={(content) => (jsonEditorContent = content)}
      />
    {:else}
      <VStack gap={0}>
        <Card expandable>
          <CardHeader>
            <div class="flex place-items-start gap-3">
              <Icon icon={mdiInformationOutline} size="20" class="mt-1" />
              <div class="flex flex-col">
                <CardTitle>Basic information</CardTitle>
                <CardDescription>Describing the workflow</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <VStack gap={6}>
              <Field class="text-sm" label={$t('name')} for="workflow-name" required>
                <Input id="workflow-name" placeholder={$t('workflow_name')} bind:value={name} />
              </Field>
              <Field class="text-sm" label={$t('description')} for="workflow-description">
                <Textarea id="workflow-description" placeholder={$t('workflow_description')} bind:value={description} />
              </Field>
            </VStack>
          </CardBody>
        </Card>

        <div class="my-10 h-px w-[98%] bg-light-200"></div>

        <Card expandable>
          <CardHeader class="bg-primary-50">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFlashOutline} size="20" class="mt-1 text-primary" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-primary">{$t('trigger')}</CardTitle>
                <CardDescription>{$t('trigger_description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <div class="grid grid-cols-2 gap-4">
              {#each triggers as trigger (trigger.name)}
                <WorkflowTriggerCard
                  {trigger}
                  selected={selectedTrigger.type === trigger.type}
                  onclick={() => handleTriggerChange(trigger)}
                />
              {/each}
            </div>
          </CardBody>
        </Card>

        <WorkflowCardConnector />

        <Card expandable>
          <CardHeader class="bg-warning-50">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFilterOutline} size="20" class="mt-1 text-warning" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-warning">{$t('filter')}</CardTitle>
                <CardDescription>{$t('filter_description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {#if selectedFilters.length === 0}
              {@render emptyCreateButton($t('add_filter'), $t('add_filter_description'), () => handleAddStep('filter'))}
            {:else}
              {#each selectedFilters as filter, index (index)}
                {#if index > 0}
                  {@render stepSeparator()}
                {/if}
                <div
                  use:dragAndDrop={{
                    index,
                    onDragStart: handleFilterDragStart,
                    onDragEnter: handleFilterDragEnter,
                    onDrop: handleFilterDrop,
                    onDragEnd: handleFilterDragEnd,
                    isDragging: draggedFilterIndex === index,
                    isDragOver: dragOverFilterIndex === index,
                  }}
                  class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-light-50 border-dashed border-transparent hover:border-light-300"
                >
                  <div class="flex items-start gap-4">
                    {@render cardOrder(index)}
                    <div class="flex-1">
                      <h1 class="font-bold text-lg mb-3">{filter.title}</h1>
                      <SchemaFormFields
                        schema={filter.schema}
                        bind:config={filterConfigs}
                        configKey={filter.methodName}
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <Button
                        size="medium"
                        variant="ghost"
                        color="danger"
                        onclick={() => handleRemoveFilter(index)}
                        leadingIcon={mdiTrashCanOutline}
                      />
                    </div>
                  </div>
                </div>
              {/each}

              <Button
                size="small"
                fullWidth
                variant="ghost"
                leadingIcon={mdiPlus}
                onclick={() => handleAddStep('filter')}
              >
                Add more
              </Button>
            {/if}
          </CardBody>
        </Card>

        <WorkflowCardConnector />

        <Card expandable expanded>
          <CardHeader class="bg-success-50">
            <div class="flex items-start gap-3">
              <Icon icon={mdiPlayCircleOutline} size="20" class="mt-1 text-success" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-success">{$t('action')}</CardTitle>
                <CardDescription>{$t('action_description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {#if selectedActions.length === 0}
              {@render emptyCreateButton($t('add_action'), $t('add_action_description'), () => handleAddStep('action'))}
            {:else}
              {#each selectedActions as action, index (index)}
                {#if index > 0}
                  {@render stepSeparator()}
                {/if}
                <div
                  use:dragAndDrop={{
                    index,
                    onDragStart: handleActionDragStart,
                    onDragEnter: handleActionDragEnter,
                    onDrop: handleActionDrop,
                    onDragEnd: handleActionDragEnd,
                    isDragging: draggedActionIndex === index,
                    isDragOver: dragOverActionIndex === index,
                  }}
                  class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-light-50 border-dashed border-transparent hover:border-light-300"
                >
                  <div class="flex items-start gap-4">
                    {@render cardOrder(index)}
                    <div class="flex-1">
                      <h1 class="font-bold text-lg mb-3">{action.title}</h1>
                      <SchemaFormFields
                        schema={action.schema}
                        bind:config={actionConfigs}
                        configKey={action.methodName}
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <Button
                        size="medium"
                        variant="ghost"
                        color="danger"
                        onclick={() => handleRemoveAction(index)}
                        leadingIcon={mdiTrashCanOutline}
                      />
                    </div>
                  </div>
                </div>
              {/each}
              <Button
                size="small"
                fullWidth
                variant="ghost"
                leadingIcon={mdiPlus}
                onclick={() => handleAddStep('action')}
              >
                Add more
              </Button>
            {/if}
          </CardBody>
        </Card>
      </VStack>
    {/if}
  </Container>

  <WorkflowSummarySidebar trigger={selectedTrigger} filters={selectedFilters} actions={selectedActions} />
</main>

<ControlAppBar onClose={() => goto(AppRoute.WORKFLOWS)} backIcon={mdiArrowLeft} tailwindClasses="fixed! top-0! w-full">
  {#snippet leading()}
    <p>{data.meta.title}</p>
  {/snippet}

  {#snippet trailing()}
    <HStack gap={4}>
      <HStack gap={1} class="border rounded-lg p-1 border-light-300">
        <Button
          size="small"
          variant={viewMode === 'visual' ? 'outline' : 'ghost'}
          color={viewMode === 'visual' ? 'primary' : 'secondary'}
          leadingIcon={mdiViewDashboard}
          onclick={() => (viewMode = 'visual')}
        >
          Visual
        </Button>
        <Button
          size="small"
          variant={viewMode === 'json' ? 'outline' : 'ghost'}
          color={viewMode === 'json' ? 'primary' : 'secondary'}
          leadingIcon={mdiCodeJson}
          onclick={() => {
            viewMode = 'json';
            jsonEditorContent = jsonContent;
          }}
        >
          JSON
        </Button>
      </HStack>

      <HStack gap={2}>
        <Text class="text-sm">{editWorkflow.enabled ? 'ON' : 'OFF'}</Text>
        <Switch bind:checked={editWorkflow.enabled} />
      </HStack>

      <Button leadingIcon={mdiContentSave} size="small" color="primary" onclick={updateWorkflow} disabled={!hasChanges}>
        {$t('save')}
      </Button>
    </HStack>
  {/snippet}
</ControlAppBar>
