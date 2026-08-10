<script lang="ts">
  import { beforeNavigate, goto, invalidate } from '$app/navigation';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import WorkflowAddStepModal from '$lib/modals/WorkflowAddStepModal.svelte';
  import WorkflowEditStepModal from '$lib/modals/WorkflowEditStepModal.svelte';
  import WorkflowTriggerPicker from '$lib/modals/WorkflowTriggerPicker.svelte';
  import { Route } from '$lib/route';
  import { getWorkflowActions, handleUpdateWorkflow } from '$lib/services/workflow.service';
  import { generateId } from '$lib/utils/generate-id';
  import { getTriggerDescription, getTriggerName } from '$lib/utils/workflow';
  import type { WorkflowResponseDto, WorkflowUpdateDto } from '@immich/sdk';
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
  import { t } from 'svelte-i18n';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';
  import WorkflowJsonEditor from './WorkflowJsonEditor.svelte';
  import WorkflowStepCard from './WorkflowStepCard.svelte';
  import WorkflowSummary from './WorkflowSummary.svelte';

  type WorkflowJsonContent = Required<
    Pick<WorkflowUpdateDto, 'description' | 'enabled' | 'name' | 'steps' | 'trigger'>
  >;

  type EditMode = 'visual' | 'json';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let { id, enabled, name, description, trigger } = $state(data.workflow);
  let steps = $state(data.workflow.steps.map((step) => ({ ...step, id: generateId() })));
  let savedWorkflow = $derived(cloneDeep(data.workflow));
  let allowNavigation = $state(false);
  let isShowingNavigationDialog = $state(false);
  let isSaving = $state(false);
  let editMode = $state<EditMode>('visual');
  let dragSourceId: string | undefined;

  const workflowSummary = $derived({ name, description, trigger, steps });
  const workflowJsonContent = $derived<WorkflowJsonContent>({
    name,
    description,
    enabled,
    trigger,
    steps: steps.map(({ id: _, ...step }) => step),
  });

  const hasChanges = $derived(
    enabled !== savedWorkflow.enabled ||
      name !== savedWorkflow.name ||
      description !== savedWorkflow.description ||
      !isEqual(trigger, savedWorkflow.trigger) ||
      !isEqual(
        steps.map(({ id: _, ...step }) => step),
        savedWorkflow.steps,
      ),
  );

  const handleAddStep = async () => {
    const step = await modalManager.show(WorkflowAddStepModal, { trigger });
    if (step) {
      steps.push({ ...step, id: generateId() });
    }
  };

  const handleInsertStep = async (index: number) => {
    const step = await modalManager.show(WorkflowAddStepModal, { trigger });
    if (step) {
      steps = [...steps.slice(0, index), { ...step, id: generateId() }, ...steps.slice(index)];
    }
  };

  const handleEditStep = async (index: number) => {
    const step = steps[index];
    if (!step) {
      return;
    }

    const result = await modalManager.show(WorkflowEditStepModal, { trigger, step: cloneDeep(step) });
    if (result) {
      steps[index] = { ...result, id: generateId() };
    }
  };

  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer || !dragSourceId) {
      return;
    }

    const ghostIndex = steps.findIndex(({ id }) => id === 'ghost');
    if (ghostIndex === -1) {
      return;
    }

    const from = steps.findIndex(({ id }) => id === dragSourceId);
    const next = [...steps];
    const [step] = next.splice(from, 1);
    next[ghostIndex > from ? ghostIndex - 1 : ghostIndex] = step;
    steps = next;
    dragSourceId = undefined;
  };

  const handleDragOver = (index: number, event: DragEvent, boundingRect: DOMRect) => {
    if (!event.dataTransfer || !dragSourceId) {
      return;
    }

    const fromIndex = steps.findIndex(({ id }) => dragSourceId === id);
    const ghostIndex = steps.findIndex(({ id }) => id === 'ghost');
    const shiftedIndex = event.clientY > boundingRect.top + boundingRect.height / 2 ? index + 1 : index;

    if (index === fromIndex || shiftedIndex === fromIndex) {
      if (ghostIndex !== -1) {
        steps.splice(ghostIndex, 1);
      }
      return;
    }

    if (
      (ghostIndex !== -1 && Math.abs(shiftedIndex - ghostIndex) <= (ghostIndex > shiftedIndex ? 0 : 1)) ||
      Math.abs(shiftedIndex - fromIndex) <= (fromIndex > shiftedIndex ? 0 : 1)
    ) {
      return;
    }

    const next = steps.filter(({ id }) => id !== 'ghost');
    next.splice(shiftedIndex, 0, { ...steps[fromIndex], id: 'ghost' });
    steps = next;
  };

  const handleDeleteStep = async (index: number) => {
    const confirmed = await modalManager.showDialog({ title: $t('step_delete'), prompt: $t('step_delete_confirm') });
    if (confirmed) {
      steps.splice(index, 1);
    }
  };

  const handleJsonContentChange = (content: WorkflowJsonContent) => {
    enabled = content.enabled;
    name = content.name;
    description = content.description;
    trigger = content.trigger;
    steps = cloneDeep(content.steps).map((step) => ({ ...step, id: generateId() }));
  };

  const onClose = () => goto(Route.workflows());

  const onChangeTrigger = async () => {
    const newTrigger = await modalManager.show(WorkflowTriggerPicker, { selected: trigger });
    if (newTrigger) {
      trigger = newTrigger;
    }
  };

  const onWorkflowUpdate = async (response: WorkflowResponseDto) => {
    if (id !== response.id) {
      return;
    }

    data.workflow = response;
    savedWorkflow = cloneDeep(response);
    await invalidate('workflow:data');
  };

  const onWorkflowDelete = async (response: WorkflowResponseDto) => {
    if (id === response.id) {
      await goto(Route.workflows());
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
      if (!confirmed) {
        return;
      }

      allowNavigation = true;
      void goto(to.url);
    });
  });

  $effect(() => console.log(steps));

  const { Download, Duplicate, CopyJson, Delete } = $derived(
    getWorkflowActions($t, { ...savedWorkflow, name, description, enabled, trigger, steps }),
  );
</script>

<OnEvents {onWorkflowUpdate} {onWorkflowDelete} />

<AppShell class="">
  <AppShellBar>
    <ActionBar
      shape="round"
      static
      {onClose}
      translations={{ close: $t('back') }}
      closeIcon={mdiArrowLeft}
      actions={[Duplicate, CopyJson, Download, Delete].map((item) => ({ ...item, color: undefined }))}
    >
      <ControlBarHeader>
        <ControlBarTitle>{data.workflow.name}</ControlBarTitle>
        <ControlBarDescription>{data.workflow.description}</ControlBarDescription>
      </ControlBarHeader>
      <ControlBarContent class="flex items-center justify-end gap-6">
        {#if hasChanges}
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
        {/if}
      </ControlBarContent>
    </ActionBar>
  </AppShellBar>

  <Container size="medium" class="pt-8 pb-24" center>
    <VStack gap={4}>
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
              <Field label={$t('description')}>
                <Textarea
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

        {#each steps as step, index (step.id)}
          <div class="w-full" animate:flip={{ duration: 120 }}>
            <WorkflowStepCard
              {step}
              {index}
              onEdit={handleEditStep}
              onDelete={handleDeleteStep}
              onInsertBefore={handleInsertStep}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDrop}
              onDragStart={(event) => (dragSourceId = event.dataTransfer?.getData('text/plain'))}
            />
          </div>
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

  <WorkflowSummary workflow={workflowSummary} />
</AppShell>
