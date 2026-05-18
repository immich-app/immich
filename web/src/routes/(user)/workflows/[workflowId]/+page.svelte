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
    Badge,
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
    mdiAutoFix,
    mdiCodeJson,
    mdiContentSave,
    mdiFilterVariant,
    mdiFlashOutline,
    mdiFormatListBulletedSquare,
    mdiInformationOutline,
    mdiPencilOutline,
    mdiPlus,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { cloneDeep, isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import WorkflowJsonEditor from './WorkflowJsonEditor.svelte';
  import WorkflowSummary from './WorkflowSummary.svelte';

  type WorkflowJsonContent = Required<
    Pick<WorkflowUpdateDto, 'description' | 'enabled' | 'name' | 'steps' | 'trigger'>
  >;

  type EditMode = 'visual' | 'json';

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
  const workflowSummary = $derived({ trigger, steps });
  const workflowJsonContent = $derived<WorkflowJsonContent>({ description, enabled, name, steps, trigger });
  const stepsWithConfigEntries = $derived(
    steps.map((step) => ({
      step,
      configEntries: getConfigEntries(step.config),
    })),
  );

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

  const truncate = (input: string, max = 24) => (input.length > max ? input.slice(0, max - 1) + '…' : input);

  const formatConfigValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'on' : 'off';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      return `"${truncate(value)}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return $t('none');
      }
      const items = value.map((v) => (v !== null && typeof v === 'object' ? '{…}' : String(v)));
      const joined = items.join(' · ');
      if (joined.length <= 28) {
        return `"${joined}"`;
      }
      return $t('items_count', { values: { count: value.length } });
    }
    return '{…}';
  };

  function getConfigEntries(config: WorkflowStepDto['config']) {
    return Object.entries(config ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');
  }

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

<AppShell class="bg-stone-50 dark:bg-stone-900">
  <AppShellBar>
    <ActionBar static {onClose} translations={{ close: $t('back') }} closeIcon={mdiArrowLeft}>
      <ControlBarHeader>
        <ControlBarTitle>{data.workflow.name}</ControlBarTitle>
        <ControlBarDescription>{data.workflow.description}</ControlBarDescription>
      </ControlBarHeader>
      <ControlBarContent class="flex items-center justify-end gap-6">
        <div class="flex gap-1 rounded-full border border-muted bg-light p-1" role="group">
          <Button
            variant={editMode === 'visual' ? 'outline' : 'ghost'}
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
            variant={editMode === 'json' ? 'outline' : 'ghost'}
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
        <Card expandable>
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

        {#snippet sequenceConnector()}
          <div class="-my-4 flex w-full items-center gap-3 px-4">
            <div class="flex w-1 shrink-0 justify-start">
              <div class="h-8 w-0.5 bg-light-200"></div>
            </div>
          </div>
        {/snippet}

        {#each stepsWithConfigEntries as { step, configEntries }, index (index)}
          {@const method = pluginManager.getMethod(step.method)}
          {@const isFilter = method?.uiHints?.includes('filter') ?? false}
          {@render sequenceConnector()}
          <Card class="{isFilter ? '' : ''} bg-light shadow-none">
            <CardHeader>
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  class:bg-primary-50={isFilter}
                  class:bg-danger-50={!isFilter}
                >
                  <Icon
                    icon={isFilter ? mdiFilterVariant : mdiAutoFix}
                    size="20"
                    class={isFilter ? 'text-primary' : 'text-danger'}
                  />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <CardTitle class="truncate">
                    {index + 1}. {pluginManager.getMethodLabel(step.method)}
                  </CardTitle>
                  {#if method?.description}
                    <CardDescription class="truncate">{method.description}</CardDescription>
                  {/if}
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <IconButton
                    icon={mdiPencilOutline}
                    aria-label={$t('edit')}
                    variant="ghost"
                    shape="round"
                    color="secondary"
                    size="small"
                    onclick={() => handleEditStep(index)}
                  />
                  <IconButton
                    icon={mdiTrashCanOutline}
                    aria-label={$t('delete')}
                    variant="ghost"
                    shape="round"
                    color="danger"
                    size="small"
                    onclick={() => handleDeleteStep(index)}
                  />
                </div>
              </div>
            </CardHeader>

            {#if configEntries.length > 0}
              <CardBody class="py-3">
                <div class="flex flex-wrap items-center gap-1.5">
                  {#each configEntries as [key, value] (key)}
                    <Badge color="secondary" shape="round" size="small" class="font-mono">
                      <span class="opacity-70">{key}=</span>{formatConfigValue(value)}
                    </Badge>
                  {/each}
                </div>
              </CardBody>
            {/if}
          </Card>
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
