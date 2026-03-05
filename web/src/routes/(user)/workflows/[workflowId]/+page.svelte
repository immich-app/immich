<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import WorkflowAddStepModal from '$lib/modals/WorkflowAddStepModal.svelte';
  import WorkflowEditStepModal from '$lib/modals/WorkflowEditStepModal.svelte';
  import WorkflowTriggerPicker from '$lib/modals/WorkflowTriggerPicker.svelte';
  import { Route } from '$lib/route';
  import { handleUpdateWorkflow } from '$lib/services/workflow.service';
  import { getTriggerDescription, getTriggerName } from '$lib/utils/workflow';
  import type { WorkflowResponseDto, WorkflowStepDto } from '@immich/sdk';
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
    Stack,
    Switch,
    Text,
    Textarea,
    VStack,
    type ActionItem,
  } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiContentSave,
    mdiFlashOutline,
    mdiFormatListBulletedSquare,
    mdiInformationOutline,
    mdiPencilOutline,
    mdiPlus,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let { id, enabled, name, description, trigger, steps } = $derived(data.workflow);

  const handleAddStep = async () => {
    const step = await modalManager.show(WorkflowAddStepModal, { trigger });
    if (step) {
      steps = [...steps, step];
    }
  };

  const handleEditStep = async (step: WorkflowStepDto) => {
    const result = await modalManager.show(WorkflowEditStepModal, { trigger, step });
    if (result) {
      Object.assign(step, result);
    }
  };

  const handleDeleteStep = async (index: number) => {
    const confirmed = await modalManager.showDialog({ title: $t('step_delete'), prompt: $t('step_delete_confirm') });
    if (confirmed) {
      steps.splice(index, 1);
      steps = [...steps];
    }
  };

  const onClose = async () => {
    // check for pending changes
    await goto(Route.workflows());
  };

  const onChangeTrigger = async () => {
    const newTrigger = await modalManager.show(WorkflowTriggerPicker, { selected: trigger });
    if (newTrigger) {
      trigger = newTrigger;
    }
  };

  const onWorkflowUpdate = async (response: WorkflowResponseDto) => {
    if (id === response.id) {
      data.workflow = response;
      await invalidate('workflow:data');
    }
  };

  const Done: ActionItem = {
    title: $t('save'),
    icon: mdiContentSave,
    color: 'primary',
    onAction: () => handleUpdateWorkflow(id, { enabled, name, description, trigger, steps }),
  };
</script>

<OnEvents {onWorkflowUpdate} />

<AppShell>
  <AppShellBar>
    <ActionBar static {onClose} translations={{ close: $t('back') }} closeIcon={mdiArrowLeft}>
      <ControlBarHeader>
        <ControlBarTitle>{data.workflow.name}</ControlBarTitle>
        <ControlBarDescription>{data.workflow.description}</ControlBarDescription>
      </ControlBarHeader>
      <ControlBarContent class="flex justify-end">
        <HeaderActionButton action={Done} variant="filled" />
      </ControlBarContent>
    </ActionBar>
  </AppShellBar>

  <Container size="medium" class="pt-8 pb-24" center>
    <VStack gap={4}>
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
                {#if index > 0}
                  <hr />
                {/if}
                <div
                  // {@attach dragAndDrop({
                  //   index,
                  //   onDragStart: handleFilterDragStart,
                  //   onDragEnter: handleFilterDragEnter,
                  //   onDrop: handleFilterDrop,
                  //   onDragEnd: handleFilterDragEnd,
                  //   isDragging: draggedIndex === index,
                  //   isDragOver: dragOverIndex === index,
                  // })}
                  class="flex cursor-move justify-between gap-2 rounded-2xl border-2 border-dashed bg-light-50 p-4 transition-all hover:border-light-300"
                >
                  <div class="flex flex-col gap-1">
                    <Text>{pluginManager.getMethodLabel(step.method)}</Text>
                    {#if method?.description}
                      <Text color="muted" size="small">{method.description}</Text>
                    {/if}
                  </div>
                  <div class="flex gap-1">
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
    </VStack>
  </Container>
</AppShell>
