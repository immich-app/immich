<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { copyToClipboard } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createWorkflow,
    deleteWorkflow,
    PluginTriggerType,
    updateWorkflow,
    type WorkflowResponseDto,
  } from '@immich/sdk';
  import { Button, Card, CardBody, CardTitle, HStack, Icon, IconButton, toastManager } from '@immich/ui';
  import {
    mdiChevronDown,
    mdiChevronUp,
    mdiContentCopy,
    mdiDelete,
    mdiPencil,
    mdiPlay,
    mdiPlayPause,
    mdiPlus,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let workflows = $state<WorkflowResponseDto[]>(data.workflows);
  // svelte-ignore non_reactive_update
  let expandedWorkflows = new SvelteSet();

  const toggleExpanded = (id: string) => {
    const newExpanded = new SvelteSet(expandedWorkflows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    expandedWorkflows = newExpanded;
  };

  const handleCopyWorkflow = async (workflow: WorkflowResponseDto) => {
    const workflowJson = JSON.stringify(workflow, null, 2);
    await copyToClipboard(workflowJson);
  };

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
    await goto(`${AppRoute.WORKFLOWS_EDIT}/${workflow.id}`);
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

    await goto(`${AppRoute.WORKFLOWS_EDIT}/${workflow.id}`);
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      AssetCreate: $t('asset_created'),
      PersonRecognized: $t('person_recognized'),
    };
    return labels[triggerType] || triggerType;
  };
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button shape="round" color="primary" onclick={handleCreateWorkflow}>
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
        <div class="my-5 flex flex-col gap-4">
          {#each workflows as workflow (workflow.id)}
            <Card color="secondary">
              <CardBody>
                <div class="flex flex-col gap-2">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <CardTitle>{workflow.name || $t('untitled_workflow')}</CardTitle>
                      {#if workflow.description}
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{workflow.description}</p>
                      {/if}
                    </div>
                    <HStack gap={1}>
                      <IconButton
                        shape="round"
                        color="secondary"
                        icon={workflow.enabled ? mdiPlay : mdiPlayPause}
                        aria-label={workflow.enabled ? $t('disabled') : $t('enabled')}
                        onclick={() => handleToggleEnabled(workflow)}
                        class={workflow.enabled ? 'text-green-500' : 'text-gray-400'}
                      />
                      <IconButton
                        shape="round"
                        color="secondary"
                        icon={mdiContentCopy}
                        aria-label={$t('copy_to_clipboard')}
                        onclick={() => handleCopyWorkflow(workflow)}
                      />
                      <IconButton
                        shape="round"
                        color="secondary"
                        icon={mdiPencil}
                        aria-label={$t('edit')}
                        onclick={() => handleEditWorkflow(workflow)}
                      />
                      <IconButton
                        shape="round"
                        color="secondary"
                        icon={mdiDelete}
                        aria-label={$t('delete')}
                        onclick={() => handleDeleteWorkflow(workflow)}
                      />
                    </HStack>
                  </div>

                  <div class="flex flex-wrap gap-2 text-sm">
                    <span
                      class="rounded-full px-3 py-1 {workflow.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}"
                    >
                      {workflow.enabled ? $t('enabled') : $t('disabled')}
                    </span>
                    <span class="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {getTriggerLabel(workflow.triggerType)}
                    </span>
                    <span
                      class="rounded-full bg-purple-100 px-3 py-1 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {workflow.filters.length}
                      {workflow.filters.length === 1 ? $t('filter') : $t('filter')}
                    </span>
                    <span
                      class="rounded-full bg-orange-100 px-3 py-1 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    >
                      {workflow.actions.length}
                      {workflow.actions.length === 1 ? $t('action') : $t('actions')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onclick={() => toggleExpanded(workflow.id)}
                    class="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Icon icon={expandedWorkflows.has(workflow.id) ? mdiChevronUp : mdiChevronDown} size="18" />
                    {expandedWorkflows.has(workflow.id) ? $t('hide_json') : $t('show_json')}
                  </button>

                  {#if expandedWorkflows.has(workflow.id)}
                    <div class="mt-2">
                      <pre class="overflow-x-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">{JSON.stringify(
                          workflow,
                          null,
                          2,
                        )}</pre>
                    </div>
                  {/if}
                </div>
              </CardBody>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
  </section>
</UserPageLayout>
