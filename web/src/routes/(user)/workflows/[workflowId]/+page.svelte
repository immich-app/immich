<script lang="ts">
  import { beforeNavigate, goto, invalidate } from '$app/navigation';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import WorkflowAddStepModal from '$lib/modals/WorkflowAddStepModal.svelte';
  import WorkflowEditStepModal from '$lib/modals/WorkflowEditStepModal.svelte';
  import WorkflowTriggerPicker from '$lib/modals/WorkflowTriggerPicker.svelte';
  import { Route } from '$lib/route';
  import { handleUpdateWorkflow } from '$lib/services/workflow.service';
  import { getTriggerDescription, getTriggerName } from '$lib/utils/workflow';
  import type { WorkflowResponseDto, WorkflowStepDto, WorkflowUpdateDto } from '@immich/sdk';
  import {
    ActionBar,
    AppShell,
    AppShellBar,
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    Container,
    ControlBarContent,
    ControlBarDescription,
    ControlBarHeader,
    ControlBarTitle,
    Field,
    Icon,
    IconButton,
    Input,
    modalManager,
    Switch,
    Textarea,
    VStack,
  } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiCodeJson,
    mdiContentSave,
    mdiFlashOutline,
    mdiFormatListBulletedSquare,
    mdiInformationOutline,
    mdiPencilOutline,
    mdiPlus,
  } from '@mdi/js';
  import { cloneDeep, isEqual } from 'lodash-es';
  import { flushSync } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import WorkflowJsonEditor from './WorkflowJsonEditor.svelte';
  import WorkflowStepCard from './WorkflowStepCard.svelte';
  import WorkflowStepDragImage from './WorkflowStepDragImage.svelte';
  import WorkflowSummary from './WorkflowSummary.svelte';

  type WorkflowJsonContent = Required<
    Pick<WorkflowUpdateDto, 'description' | 'enabled' | 'name' | 'steps' | 'trigger'>
  >;

  type EditMode = 'visual' | 'json';
  type StepDragImage = {
    description?: string;
    isFilter: boolean;
    label: string;
    stepNumber: number;
  };

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let { id, enabled, name, description, trigger, steps } = $derived(data.workflow);
  let savedWorkflow = $state(cloneDeep(data.workflow));
  let allowNavigation = $state(false);
  let isShowingNavigationDialog = $state(false);
  let isSaving = $state(false);
  let editMode = $state<EditMode>('visual');
  let draggedIndex = $state<number | null>(null);
  let dragHandleHoverIndex = $state<number | null>(null);
  let dragImageElement = $state<HTMLElement | null>(null);
  let dragImage = $state<StepDragImage>({ isFilter: false, label: '', stepNumber: 1 });
  let dropTargetIndex = $state<number | null>(null);

  const workflowSummary = $derived({ name, description, trigger, steps });
  const workflowJsonContent = $derived<WorkflowJsonContent>({ description, enabled, name, steps, trigger });

  const hasChanges = $derived(
    enabled !== savedWorkflow.enabled ||
      name !== savedWorkflow.name ||
      description !== savedWorkflow.description ||
      !isEqual(trigger, savedWorkflow.trigger) ||
      !isEqual(steps, savedWorkflow.steps),
  );

  const handleAddStep = async () => {
    const step = await modalManager.show(WorkflowAddStepModal, { trigger });
    if (step) {
      steps = [...steps, step];
    }
  };

  const handleInsertStep = async (index: number) => {
    const step = await modalManager.show(WorkflowAddStepModal, { trigger });
    if (step) {
      steps = [...steps.slice(0, index), step, ...steps.slice(index)];
    }
  };

  const replaceStep = (index: number, step: WorkflowStepDto) => {
    steps = steps.map((current, i) => (i === index ? cloneDeep(step) : current));
  };

  const handleEditStep = async (index: number) => {
    const step = steps[index];
    if (!step) {
      return;
    }

    const result = await modalManager.show(WorkflowEditStepModal, { trigger, step: cloneDeep(step) });
    if (result) {
      replaceStep(index, result);
    }
  };

  const handleDragStart = (index: number, event: DragEvent) => {
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));

      const step = steps[index];
      const method = step ? pluginManager.getMethod(step.method) : undefined;
      dragImage = {
        description: method?.description,
        isFilter: method?.uiHints?.includes('filter') ?? false,
        label: step ? pluginManager.getMethodLabel(step.method) : '',
        stepNumber: index + 1,
      };
      flushSync();

      if (dragImageElement) {
        event.dataTransfer.setDragImage(dragImageElement, 16, 22);
      }
    }
  };

  const handleDragOver = (index: number, event: DragEvent) => {
    if (draggedIndex === null) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (dropTargetIndex !== index) {
      dropTargetIndex = index;
    }
  };

  const handleDragLeave = (index: number) => {
    if (dropTargetIndex === index) {
      dropTargetIndex = null;
    }
  };

  const handleDrop = (index: number, event: DragEvent) => {
    event.preventDefault();
    const from = draggedIndex;
    draggedIndex = null;
    dropTargetIndex = null;
    if (from === null || from === index) {
      return;
    }
    const next = [...steps];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    steps = next;
  };

  const handleDragEnd = () => {
    draggedIndex = null;
    dragHandleHoverIndex = null;
    dropTargetIndex = null;
  };

  const handleDeleteStep = async (index: number) => {
    const confirmed = await modalManager.showDialog({ title: $t('step_delete'), prompt: $t('step_delete_confirm') });
    if (confirmed) {
      steps.splice(index, 1);
      steps = [...steps];
    }
  };

  const handleJsonContentChange = (content: WorkflowJsonContent) => {
    enabled = content.enabled;
    name = content.name;
    description = content.description;
    trigger = content.trigger;
    steps = cloneDeep(content.steps);
  };

  const onClose = () => goto(Route.workflows());

  const onChangeTrigger = async () => {
    const newTrigger = await modalManager.show(WorkflowTriggerPicker, { selected: trigger });
    if (newTrigger) {
      trigger = newTrigger;
    }
  };

  const onWorkflowUpdate = async (response: WorkflowResponseDto) => {
    if (id === response.id) {
      data.workflow = response;
      savedWorkflow = cloneDeep(response);
      await invalidate('workflow:data');
    }
  };

  const confirmNavigation = async () => {
    if (!hasChanges) {
      return true;
    }

    if (isShowingNavigationDialog) {
      return false;
    }

    try {
      isShowingNavigationDialog = true;
      return await modalManager.showDialog({
        prompt: $t('workflow_navigation_prompt'),
        confirmColor: 'primary',
      });
    } finally {
      isShowingNavigationDialog = false;
    }
  };

  const saveWorkflow = async () => {
    if (!hasChanges || isSaving) {
      return;
    }

    isSaving = true;
    try {
      const submitted = { enabled, name, description, trigger, steps: cloneDeep(steps) };
      const saved = await handleUpdateWorkflow(id, submitted);

      if (saved) {
        Object.assign(savedWorkflow, submitted);
      }
    } finally {
      isSaving = false;
    }
  };

  beforeNavigate(({ cancel, to, willUnload }) => {
    if (!hasChanges || allowNavigation) {
      return;
    }

    cancel();

    if (willUnload || !to) {
      return;
    }

    void confirmNavigation().then((confirmed) => {
      if (confirmed) {
        allowNavigation = true;
        void goto(to.url);
      }
    });
  });
</script>

<OnEvents {onWorkflowUpdate} />

<AppShell class="">
  <AppShellBar>
    <ActionBar static {onClose} translations={{ close: $t('back') }} closeIcon={mdiArrowLeft}>
      <ControlBarHeader>
        <ControlBarTitle>{data.workflow.name}</ControlBarTitle>
        <ControlBarDescription>{data.workflow.description}</ControlBarDescription>
      </ControlBarHeader>
      <ControlBarContent class="flex items-center justify-end gap-6">
        <div class="flex gap-1 rounded-full border border-light-200 bg-light p-1" role="group">
          <Button
            variant={editMode === 'visual' ? 'filled' : 'ghost'}
            color={editMode === 'visual' ? 'primary' : 'secondary'}
            size="small"
            leadingIcon={mdiFormatListBulletedSquare}
            aria-pressed={editMode === 'visual'}
            onclick={() => (editMode = 'visual')}
            shape="round"
          >
            {$t('visual')}
          </Button>
          <Button
            variant={editMode === 'json' ? 'filled' : 'ghost'}
            color={editMode === 'json' ? 'primary' : 'secondary'}
            size="small"
            leadingIcon={mdiCodeJson}
            aria-pressed={editMode === 'json'}
            onclick={() => (editMode = 'json')}
            shape="round"
          >
            JSON
          </Button>
        </div>

        <Button
          variant="filled"
          size="small"
          color="primary"
          leadingIcon={mdiContentSave}
          disabled={!hasChanges || isSaving}
          loading={isSaving}
          onclick={saveWorkflow}
        >
          {$t('save')}
        </Button>
      </ControlBarContent>
    </ActionBar>
  </AppShellBar>

  <Container size="medium" class="pt-8 pb-24" center>
    <VStack gap={4}>
      {#if editMode === 'visual'}
        <Card class="shadow-none" expandable>
          <CardHeader>
            <div class="flex place-items-start gap-3">
              <Icon icon={mdiInformationOutline} size="20" class="mt-1" />
              <div class="flex flex-col">
                <CardTitle>
                  {$t('workflow_info')}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <VStack gap={4}>
              <div class="relative w-full overflow-hidden rounded-xl border p-4" class:bg-primary-50={enabled}>
                <Field label={enabled ? $t('enabled') : $t('disabled')} color={enabled ? 'primary' : 'secondary'}>
                  <Switch bind:checked={enabled} />
                </Field>
              </div>

              <Field label={$t('name')} required>
                <Input
                  placeholder={$t('workflow_name')}
                  bind:value={() => name ?? '', (value) => (name = value || null)}
                />
              </Field>
              <Field label={$t('description')} for="workflow-description">
                <Textarea
                  id="workflow-description"
                  grow
                  placeholder={$t('workflow_description')}
                  bind:value={() => description ?? '', (value) => (description = value || null)}
                />
              </Field>
            </VStack>
          </CardBody>
        </Card>

        <div class="my-4 h-px w-[98%] bg-light-200"></div>

        <Card class="shadow-none">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-50">
                <Icon icon={mdiFlashOutline} size="20" class="text-success" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col">
                <CardTitle class="truncate">{getTriggerName($t, trigger)}</CardTitle>
                <CardDescription class="truncate">{getTriggerDescription($t, trigger)}</CardDescription>
              </div>

              <IconButton
                icon={mdiPencilOutline}
                aria-label={$t('edit')}
                variant="ghost"
                shape="round"
                color="secondary"
                size="small"
                onclick={onChangeTrigger}
              />
            </div>
          </CardHeader>
        </Card>

        {#each steps as step, index (index)}
          <WorkflowStepCard
            {step}
            {index}
            isDragging={draggedIndex === index}
            isDragHandleHovered={dragHandleHoverIndex === index}
            isDropTarget={dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index}
            onEdit={handleEditStep}
            onDelete={handleDeleteStep}
            onInsertBefore={handleInsertStep}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragHandleEnter={(i) => (dragHandleHoverIndex = i)}
            onDragHandleLeave={() => (dragHandleHoverIndex = null)}
          />
        {/each}

        <Button
          size="small"
          fullWidth
          variant="ghost"
          leadingIcon={mdiPlus}
          class="border border-dashed"
          onclick={handleAddStep}
        >
          {$t('add_step')}
        </Button>
      {:else}
        <WorkflowJsonEditor jsonContent={workflowJsonContent} onContentChange={handleJsonContentChange} />
      {/if}
    </VStack>
  </Container>

  <WorkflowStepDragImage
    bind:ref={dragImageElement}
    description={dragImage.description}
    isFilter={dragImage.isFilter}
    label={dragImage.label}
    stepNumber={dragImage.stepNumber}
  />
  <WorkflowSummary workflow={workflowSummary} />
</AppShell>
