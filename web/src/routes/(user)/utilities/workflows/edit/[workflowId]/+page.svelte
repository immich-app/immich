<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { dragAndDrop } from '$lib/actions/drag-and-drop';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SchemaFormFields from '$lib/components/workflow/schema-form/SchemaFormFields.svelte';
  import WorkflowCardConnector from '$lib/components/workflows/workflow-card-connector.svelte';
  import WorkflowJsonEditor from '$lib/components/workflows/workflow-json-editor.svelte';
  import WorkflowTriggerCard from '$lib/components/workflows/workflow-trigger-card.svelte';
  import AddWorkflowStepModal from '$lib/modals/AddWorkflowStepModal.svelte';
  import WorkflowNavigationConfirmModal from '$lib/modals/WorkflowNavigationConfirmModal.svelte';
  import WorkflowTriggerUpdateConfirmModal from '$lib/modals/WorkflowTriggerUpdateConfirmModal.svelte';
  import { WorkflowService, type WorkflowPayload } from '$lib/services/workflow.service';
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
  } from '@immich/ui';
  import {
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
  const workflowService = new WorkflowService(triggers, filters, actions);

  let previousWorkflow = data.workflow;
  let editWorkflow = $state(data.workflow);

  let viewMode: 'visual' | 'json' = $state('visual');

  let name: string = $derived(editWorkflow.name ?? '');
  let description: string = $derived(editWorkflow.description ?? '');

  let selectedTrigger = $state(triggers.find((t) => t.triggerType === editWorkflow.triggerType) ?? triggers[0]);

  let triggerType = $derived(selectedTrigger.triggerType);

  let supportFilters = $derived(workflowService.getFiltersByContext(selectedTrigger.context));
  let supportActions = $derived(workflowService.getActionsByContext(selectedTrigger.context));

  let orderedFilters: PluginFilterResponseDto[] = $derived(
    workflowService.initializeOrderedFilters(editWorkflow, supportFilters),
  );
  let orderedActions: PluginActionResponseDto[] = $derived(
    workflowService.initializeOrderedActions(editWorkflow, supportActions),
  );
  let filterConfigs: Record<string, unknown> = $derived(
    workflowService.initializeFilterConfigs(editWorkflow, supportFilters),
  );
  let actionConfigs: Record<string, unknown> = $derived(
    workflowService.initializeActionConfigs(editWorkflow, supportActions),
  );

  $effect(() => {
    editWorkflow.triggerType = triggerType;
  });

  // Clear filters and actions when trigger changes (context changes)
  let previousContext = $state<string | undefined>(undefined);
  $effect(() => {
    const currentContext = selectedTrigger.context;
    if (previousContext !== undefined && previousContext !== currentContext) {
      orderedFilters = [];
      orderedActions = [];
      filterConfigs = {};
      actionConfigs = {};
    }
    previousContext = currentContext;
  });

  const updateWorkflow = async () => {
    try {
      console.log('Updating workflow with:', {
        id: editWorkflow.id,
        name,
        description,
        enabled: editWorkflow.enabled,
        triggerType,
        orderedFilters: orderedFilters.map((f) => ({ id: f.id, methodName: f.methodName })),
        orderedActions: orderedActions.map((a) => ({ id: a.id, methodName: a.methodName })),
        filterConfigs,
        actionConfigs,
      });

      const updated = await workflowService.updateWorkflow(
        editWorkflow.id,
        name,
        description,
        editWorkflow.enabled,
        triggerType,
        orderedFilters,
        orderedActions,
        filterConfigs,
        actionConfigs,
      );

      // Update the previous workflow state to the new values
      previousWorkflow = updated;
      editWorkflow = updated;
    } catch (error) {
      console.log('error', error);
      handleError(error, 'Failed to update workflow');
    }
  };

  const jsonContent = $derived(
    workflowService.buildWorkflowPayload(
      name,
      description,
      editWorkflow.enabled,
      triggerType,
      orderedFilters,
      orderedActions,
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
    const result = workflowService.parseWorkflowJson(JSON.stringify(jsonEditorContent));

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

      orderedFilters = result.data.filters;
      orderedActions = result.data.actions;
      filterConfigs = result.data.filterConfigs;
      actionConfigs = result.data.actionConfigs;
    }
  };

  let hasChanges: boolean = $derived(
    workflowService.hasWorkflowChanged(
      previousWorkflow,
      editWorkflow.enabled,
      name,
      description,
      triggerType,
      orderedFilters,
      orderedActions,
      filterConfigs,
      actionConfigs,
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

    const newFilters = [...orderedFilters];
    const [draggedItem] = newFilters.splice(draggedFilterIndex, 1);
    newFilters.splice(index, 0, draggedItem);
    orderedFilters = newFilters;
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

    const newActions = [...orderedActions];
    const [draggedItem] = newActions.splice(draggedActionIndex, 1);
    newActions.splice(index, 0, draggedItem);
    orderedActions = newActions;
  };

  const handleActionDragEnd = () => {
    draggedActionIndex = null;
    dragOverActionIndex = null;
  };

  const handleAddStep = async (type?: 'action' | 'filter') => {
    const result = (await modalManager.show(AddWorkflowStepModal, {
      filters: supportFilters,
      actions: supportActions,
      addedFilters: orderedFilters,
      addedActions: orderedActions,
      type,
    })) as { type: 'filter' | 'action'; item: PluginFilterResponseDto | PluginActionResponseDto } | undefined;

    if (result) {
      if (result.type === 'filter') {
        orderedFilters = [...orderedFilters, result.item as PluginFilterResponseDto];
      } else if (result.type === 'action') {
        orderedActions = [...orderedActions, result.item as PluginActionResponseDto];
      }
    }
  };

  const handleRemoveFilter = (index: number) => {
    orderedFilters = orderedFilters.filter((_, i) => i !== index);
  };

  const handleRemoveAction = (index: number) => {
    orderedActions = orderedActions.filter((_, i) => i !== index);
  };

  const handleTriggerChange = async (newTrigger: PluginTriggerResponseDto) => {
    const isConfirmed = await modalManager.show(WorkflowTriggerUpdateConfirmModal);

    if (!isConfirmed) {
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
  <div
    class="h-8 w-8 rounded-lg borderflex place-items-center place-content-center shrink-0 border dark:border-gray-500"
  >
    <p class="font-mono text-sm font-bold">
      {index + 1}
    </p>
  </div>
{/snippet}

{#snippet stepSeparator()}
  <div class="relative flex justify-center py-4">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div class="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-white dark:bg-black px-2 font-semibold text-gray-500">THEN</span>
    </div>
  </div>
{/snippet}

{#snippet emptyCreateButton(title: string, description: string, onclick: () => Promise<void>)}
  <button
    type="button"
    {onclick}
    class="w-full p-8 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-600 transition-all flex flex-col items-center justify-center gap-2"
  >
    <Icon icon={mdiPlus} size="32" />
    <p class="text-sm font-medium">{title}</p>
    <p class="text-xs">{description}</p>
  </button>
{/snippet}

<UserPageLayout title={data.meta.title} scrollbar={false}>
  <!-- <WorkflowSummarySidebar trigger={selectedTrigger} filters={orderedFilters} actions={orderedActions} /> -->

  {#snippet buttons()}
    <HStack gap={4} class="me-4">
      <HStack gap={1} class="border rounded-lg p-1 dark:border-gray-600">
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

  <Container size="medium" class="p-4" center>
    {#if viewMode === 'json'}
      <WorkflowJsonEditor
        jsonContent={jsonEditorContent}
        onApply={syncFromJson}
        onContentChange={(content) => (jsonEditorContent = content)}
      />
    {:else}
      <VStack gap={0}>
        <Card expandable expanded={false}>
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
              <Field class="text-sm" label="Name" for="workflow-name" required>
                <Input placeholder="Workflow name" bind:value={name} />
              </Field>
              <Field class="text-sm" label="Description" for="workflow-description">
                <Textarea placeholder="Workflow description" bind:value={description} />
              </Field>
            </VStack>
          </CardBody>
        </Card>

        <div class="my-10 h-px w-[98%] bg-gray-200 dark:bg-gray-700"></div>

        <Card expandable expanded={true}>
          <CardHeader class="bg-indigo-50 dark:bg-primary-800">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFlashOutline} size="20" class="mt-1 text-primary" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-primary">Trigger</CardTitle>
                <CardDescription>An event that kick off the workflow</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <div class="grid grid-cols-2 gap-4">
              {#each triggers as trigger (trigger.name)}
                <WorkflowTriggerCard
                  {trigger}
                  selected={selectedTrigger.triggerType === trigger.triggerType}
                  onclick={() => handleTriggerChange(trigger)}
                />
              {/each}
            </div>
          </CardBody>
        </Card>

        <WorkflowCardConnector />

        <Card expandable expanded={true}>
          <CardHeader class="bg-amber-50 dark:bg-[#5e4100]">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFilterOutline} size="20" class="mt-1 text-warning" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-warning">Filter</CardTitle>
                <CardDescription>Conditions to filter the target assets</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {#if orderedFilters.length === 0}
              {@render emptyCreateButton('Add Filter', 'Click to add a filter condition', () =>
                handleAddStep('filter'),
              )}
            {:else}
              {#each orderedFilters as filter, index (filter.id)}
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
                  class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-gray-50 dark:bg-subtle border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600"
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
          <CardHeader class="bg-success/10 dark:bg-teal-950">
            <div class="flex items-start gap-3">
              <Icon icon={mdiPlayCircleOutline} size="20" class="mt-1 text-success" />
              <div class="flex flex-col">
                <CardTitle class="text-left text-success">Action</CardTitle>
                <CardDescription>A set of action to perform on the filtered assets</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {#if orderedActions.length === 0}
              {@render emptyCreateButton('Add Action', 'Click to add an action to perform', () =>
                handleAddStep('action'),
              )}
            {:else}
              {#each orderedActions as action, index (action.id)}
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
                  class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-gray-50 dark:bg-subtle border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600"
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
</UserPageLayout>
