<script lang="ts">
  import { dragAndDrop } from '$lib/actions/drag-and-drop';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SchemaFormFields from '$lib/components/workflow/schema-form/SchemaFormFields.svelte';
  import WorkflowCardConnector from '$lib/components/workflows/workflow-card-connector.svelte';
  import WorkflowSummarySidebar from '$lib/components/workflows/workflow-summary-sidebar.svelte';
  import WorkflowTriggerCard from '$lib/components/workflows/workflow-trigger-card.svelte';
  import type { PluginActionResponseDto, PluginFilterResponseDto } from '@immich/sdk';
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
  } from '@immich/ui';
  import {
    mdiContentSave,
    mdiDragVertical,
    mdiFilterOutline,
    mdiFlashOutline,
    mdiInformationOutline,
    mdiPlayCircleOutline,
  } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const triggers = data.triggers;
  const filters = data.plugins.flatMap((plugin) => plugin.filters);
  const action = data.plugins.flatMap((plugin) => plugin.actions);

  let previousWorkflow = data.workflow;
  let editWorkflow = $state(data.workflow);

  let name: string = $state(editWorkflow.name ?? '');
  let description: string = $state(editWorkflow.description ?? '');

  let selectedTrigger = $state(triggers.find((t) => t.triggerType === editWorkflow.triggerType) ?? triggers[0]);
  let triggerType = $derived(selectedTrigger.triggerType);

  let supportFilters = $derived(filters.filter((filter) => filter.supportedContexts.includes(selectedTrigger.context)));
  let supportActions = $derived(action.filter((action) => action.supportedContexts.includes(selectedTrigger.context)));

  let orderedFilters: PluginFilterResponseDto[] = $derived(supportFilters);
  let orderedActions: PluginActionResponseDto[] = $derived(supportActions);

  $effect(() => {
    editWorkflow.triggerType = triggerType;
  });

  const updateWorkflow = async () => {};

  let canSave: boolean = $derived(!isEqual(previousWorkflow, editWorkflow));

  let filterConfigs: Record<string, unknown> = $state({});
  let actionConfigs: Record<string, unknown> = $state({});

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
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
  <WorkflowSummarySidebar trigger={selectedTrigger} filters={orderedFilters} actions={orderedActions} />

  {#snippet buttons()}
    <HStack gap={4} class="me-4">
      <HStack gap={2}>
        <Text class="text-sm">{editWorkflow.enabled ? 'ON' : 'OFF'}</Text>
        <Switch bind:checked={editWorkflow.enabled} />
      </HStack>
      <Button
        leadingIcon={mdiContentSave}
        size="small"
        shape="round"
        color="primary"
        onclick={updateWorkflow}
        disabled={!canSave}
      >
        {$t('save')}
      </Button>
    </HStack>
  {/snippet}

  <Container size="medium" class="p-4" center>
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
        <CardHeader class="bg-indigo-50 dark:bg-primary/20">
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
                onclick={() => (selectedTrigger = trigger)}
              />
            {/each}
          </div>
        </CardBody>
      </Card>

      <WorkflowCardConnector />

      <Card expandable expanded={false}>
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
          <!-- <div class="my-4">
            <p>Payload</p>
            <CodeBlock code={JSON.stringify(orderedFilterPayload, null, 2)} lineNumbers></CodeBlock>
          </div> -->

          {#each orderedFilters as filter, index (filter.id)}
            {#if index > 0}
              <div class="relative flex justify-center py-4">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                  <div class="w-full border-t-2 border-dashed border-muted"></div>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span class="bg-white dark:bg-gray-900 px-2 font-semibold">THEN</span>
                </div>
              </div>
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
              class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-gray-50 dark:bg-gray-950/20 border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div class="flex items-start gap-4">
                <div class="h-8 w-8 rounded-lg borderflex place-items-center place-content-center shrink-0 border">
                  <p class="font-mono text-sm font-bold">
                    {index + 1}
                  </p>
                </div>
                <div class="flex-1">
                  <h1 class="font-bold text-lg mb-3">{filter.title}</h1>
                  <SchemaFormFields schema={filter.schema} bind:config={filterConfigs} configKey={filter.methodName} />
                </div>
                <Icon icon={mdiDragVertical} class="mt-1 text-primary shrink-0" />
              </div>
            </div>
          {/each}
        </CardBody>
      </Card>

      <WorkflowCardConnector />

      <Card expandable>
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
          <!-- <div class="my-4">
            <p>Payload</p>
            <CodeBlock code={JSON.stringify(orderedActionPayload, null, 2)} lineNumbers></CodeBlock>
          </div> -->

          {#each orderedActions as action, index (action.id)}
            {#if index > 0}
              <div class="relative flex justify-center py-4">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                  <div class="w-full border-t-2 border-dashed border-muted"></div>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span class="bg-white dark:bg-gray-900 px-2 font-semibold">THEN</span>
                </div>
              </div>
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
              class="mb-4 cursor-move rounded-lg border-2 p-4 transition-all bg-gray-50 dark:bg-gray-950/20 border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div class="flex items-start gap-4">
                <div class="h-8 w-8 rounded-lg borderflex place-items-center place-content-center shrink-0 border">
                  <p class="font-mono text-sm font-bold">
                    {index + 1}
                  </p>
                </div>
                <div class="flex-1">
                  <h1 class="font-bold text-lg mb-3">{action.title}</h1>
                  <SchemaFormFields schema={action.schema} bind:config={actionConfigs} configKey={action.methodName} />
                </div>
                <Icon icon={mdiDragVertical} class="mt-1 text-primary shrink-0" />
              </div>
            </div>
          {/each}
        </CardBody>
      </Card>
    </VStack>
  </Container>
</UserPageLayout>
