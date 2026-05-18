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
    Stack,
    Switch,
    Text,
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

  const handleEditStep = async (step: WorkflowStepDto) => {
    const result = await modalManager.show(WorkflowEditStepModal, { trigger, step: cloneDeep(step) });
    if (result) {
      Object.assign(step, result);
      steps = [...steps];
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
      return truncate(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return $t('none');
      }
      const items = value.map((v) => (v !== null && typeof v === 'object' ? '{…}' : String(v)));
      const joined = items.join(', ');
      if (joined.length <= 28) {
        return joined;
      }
      return $t('items_count', { values: { count: value.length } });
    }
    return '{…}';
  };

  const getConfigEntries = (config: WorkflowStepDto['config']) =>
    Object.entries(config ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');

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

<AppShell>
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

        <Card>
          <CardHeader class="bg-success-50">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFlashOutline} size="20" class="mt-1 text-success" />
              <div class="flex grow flex-col">
                <CardTitle class="text-left text-success">{$t('trigger')}</CardTitle>
                <CardDescription>{$t('trigger_description')}</CardDescription>
              </div>
              <div class="flex items-center justify-end">
                <Button leadingIcon={mdiPencilOutline} size="small" color="secondary" onclick={onChangeTrigger}>
                  {$t('edit')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <div class="flex flex-col items-start">
              <Text>{getTriggerName($t, trigger)}</Text>
              <Text size="small" color="muted">{getTriggerDescription($t, trigger)}</Text>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader class="bg-primary-50">
            <div class="flex items-start gap-3">
              <Icon icon={mdiFormatListBulletedSquare} size="20" class="mt-1 text-primary" />
              <CardTitle class="text-left text-primary">{$t('steps')}</CardTitle>
            </div>
          </CardHeader>

          <CardBody>
            {#if steps.length === 0}
              <Button leadingIcon={mdiPlus} onclick={handleAddStep}>{$t('add_step')}</Button>
            {:else}
              <Stack gap={2}>
                {#each steps as step, index (index)}
                  {@const method = pluginManager.getMethod(step.method)}
                  {@const entries = getConfigEntries(step.config)}
                  {#if index > 0}
                    <hr />
                  {/if}
                  <div
                    class="flex cursor-move items-start gap-3 rounded-2xl border bg-light-100 p-4 transition-all hover:border-dashed hover:border-light-300"
                  >
                    <Badge color="primary" shape="round" size="tiny" class="mt-0.5 w-6 justify-center">
                      {index + 1}
                    </Badge>
                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                      <Text fontWeight="medium">{pluginManager.getMethodLabel(step.method)}</Text>
                      {#if method?.description}
                        <Text color="muted" size="small">{method.description}</Text>
                      {/if}
                      {#if entries.length > 0}
                        <div class="mt-1 flex flex-wrap items-center gap-1.5">
                          {#each entries.slice(0, 3) as [key, value] (key)}
                            <Badge color="primary" size="small">
                              <span class="font-medium opacity-70">{key}:</span>
                              <span class="font-mono">{formatConfigValue(value)}</span>
                            </Badge>
                          {/each}
                          {#if entries.length > 3}
                            <Badge color="secondary" size="tiny">
                              +{entries.length - 3}
                            </Badge>
                          {/if}
                        </div>
                      {/if}
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <IconButton
                        icon={mdiPencilOutline}
                        aria-label={$t('edit')}
                        variant="ghost"
                        shape="round"
                        color="secondary"
                        onclick={() => handleEditStep(step)}
                      />
                      <IconButton
                        icon={mdiTrashCanOutline}
                        aria-label={$t('delete')}
                        variant="ghost"
                        shape="round"
                        color="danger"
                        onclick={() => handleDeleteStep(index)}
                      />
                    </div>
                  </div>
                {/each}

                <Button size="small" fullWidth variant="ghost" leadingIcon={mdiPlus} onclick={handleAddStep}>
                  {$t('add_step')}
                </Button>
              </Stack>
            {/if}
          </CardBody>
        </Card>
      {:else}
        <WorkflowJsonEditor jsonContent={workflowJsonContent} onContentChange={handleJsonContentChange} />
      {/if}
    </VStack>
  </Container>

  <WorkflowSummary workflow={workflowSummary} />
</AppShell>
