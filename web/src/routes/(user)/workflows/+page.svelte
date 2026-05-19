<script lang="ts">
  import { goto } from '$app/navigation';
  import emptyWorkflows from '$lib/assets/empty-workflows.svg';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import { Route } from '$lib/route';
  import { getWorkflowActions, getWorkflowsActions, getWorkflowShowSchemaAction } from '$lib/services/workflow.service';
  import { getWorkflowForShare, type WorkflowResponseDto } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeBlock,
    Container,
    IconButton,
    MenuItemType,
    menuManager,
    Text,
    VStack,
  } from '@immich/ui';
  import { mdiClose, mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let workflows = $state<WorkflowResponseDto[]>(data.workflows);

  const expandedIds = new SvelteSet<string>();

  const toggleExpanded = (id: string) => {
    if (expandedIds.has(id)) {
      expandedIds.delete(id);
    } else {
      expandedIds.add(id);
    }
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
        getWorkflowShowSchemaAction($t, expandedIds.has(workflow.id), () => toggleExpanded(workflow.id)),
        MenuItemType.Divider,
        Delete,
      ],
    });
  };

  const { Create } = $derived(getWorkflowsActions($t));

  const onWorkflowCreate = async (response: WorkflowResponseDto) => {
    await goto(Route.viewWorkflow(response));
  };

  const onWorkflowUpdate = (response: WorkflowResponseDto) => {
    workflows = workflows.map((workflow) => (workflow.id === response.id ? response : workflow));
  };

  const onWorkflowDelete = (response: WorkflowResponseDto) => {
    workflows = workflows.filter(({ id }) => id !== response.id);
  };
</script>

<OnEvents {onWorkflowCreate} {onWorkflowUpdate} {onWorkflowDelete} />

{#snippet chipItem(title: string)}
  <span class="rounded-xl border border-gray-200/80 bg-light px-3 py-1.5 text-sm dark:border-gray-600">
    <span class="font-medium text-dark">{title}</span>
  </span>
{/snippet}

<UserPageLayout title={data.meta.title} actions={[Create]} scrollbar={false}>
  <section class="flex place-content-center sm:mx-4">
    <Container center size="large" class="pb-28">
      {#if workflows.length === 0}
        <EmptyPlaceholder
          fullWidth
          title={$t('create_first_workflow')}
          text={$t('workflows_help_text')}
          onClick={() => Create.onAction(Create)}
          src={emptyWorkflows}
          class="mx-auto mt-10"
        />
      {:else}
        <div class="my-6 grid gap-6">
          {#each workflows as workflow (workflow.id)}
            <Card class="border border-light-200">
              <CardHeader
                class={`flex flex-row gap-4 px-8 py-6 sm:items-center sm:gap-6 ${
                  workflow.enabled
                    ? 'bg-linear-to-r from-green-50 to-white dark:from-green-800/50 dark:to-green-950/45'
                    : 'bg-neutral-50 dark:bg-neutral-900'
                }`}
              >
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <span class="rounded-full {workflow.enabled ? 'size-3 bg-success' : 'size-3 rounded-full bg-muted'}"
                    ></span>
                    <CardTitle>{workflow.name || $t('workflow')}</CardTitle>
                  </div>
                  {#if workflow.description}
                    <CardDescription class="mt-1 text-sm">{workflow.description}</CardDescription>
                  {/if}
                </div>

                <div class="flex items-center gap-4">
                  <div class="hidden text-right sm:block">
                    <Text size="tiny">{$t('created_at')}</Text>
                    <Text size="small" fontWeight="medium">
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
                  <div class="rounded-2xl border border-light-200 bg-light-50 p-4">
                    <div class="mb-3">
                      <Text size="tiny" color="muted" fontWeight="medium">{$t('trigger')}</Text>
                    </div>
                    {@render chipItem(getTriggerLabel(workflow.trigger))}
                  </div>

                  <!-- Actions Section -->
                  <div class="rounded-2xl border border-light-200 bg-light-50 p-4">
                    <div class="mb-3">
                      <Text size="tiny" color="muted" fontWeight="medium">{$t('steps')}</Text>
                    </div>

                    <div>
                      {#if workflow.steps.length === 0}
                        <span class="text-sm text-light-600">
                          {$t('no_steps')}
                        </span>
                      {:else}
                        <div class="flex flex-wrap gap-2">
                          {#each workflow.steps as step, i (i)}
                            {@render chipItem(pluginManager.getMethodLabel(step.method))}
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>

                {#if expandedIds.has(workflow.id)}
                  {#await getWorkflowForShare({ id: workflow.id }) then result}
                    <VStack gap={2} class="w-full rounded-2xl border border-light-200 bg-light-50 p-4">
                      <CodeBlock code={JSON.stringify(result, null, 2)} lineNumbers />
                      <Button
                        leadingIcon={mdiClose}
                        fullWidth
                        variant="ghost"
                        color="secondary"
                        onclick={() => toggleExpanded(workflow.id)}>{$t('close')}</Button
                      >
                    </VStack>
                  {/await}
                {/if}
              </CardBody>
            </Card>
          {/each}
        </div>
      {/if}
    </Container>
  </section>
</UserPageLayout>
