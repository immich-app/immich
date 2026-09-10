<script lang="ts">
  import { goto } from '$app/navigation';
  import emptyWorkflows from '$lib/assets/empty-workflows.svg';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import { Route } from '$lib/route';
  import { getWorkflowActions, getWorkflowsActions, getWorkflowShowSchemaAction } from '$lib/services/workflow.service';
  import { getWorkflowForShare, type WorkflowResponseDto } from '@immich/sdk';
  import {
    Badge,
    Button,
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeBlock,
    Container,
    ContextMenuButton,
    Icon,
    MenuItemType,
  } from '@immich/ui';
  import { mdiClose, mdiFlashOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let workflows = $state<WorkflowResponseDto[]>(data.workflows);

  const expandedIds = new SvelteSet<string>();

  const onToggleExpand = (id: string) => {
    if (expandedIds.has(id)) {
      expandedIds.delete(id);
    } else {
      expandedIds.add(id);
    }
  };

  const { Create, UseTemplate } = $derived(getWorkflowsActions($t));

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

<UserPageLayout title={data.meta.title} actions={[UseTemplate, Create]} scrollbar={false}>
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
        <div class="my-6 flex flex-col gap-3">
          {#each workflows as workflow (workflow.id)}
            {@const { ToggleEnabled, Duplicate, Logs, Edit, Delete } = getWorkflowActions($t, workflow)}

            <Card class="group shadow-none transition-colors hover:border-primary">
              <CardHeader>
                <a
                  href={Route.viewWorkflow({ id: workflow.id })}
                  class="flex items-center gap-4"
                  class:opacity-55={!workflow.enabled}
                >
                  <div
                    class={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                      workflow.enabled
                        ? 'bg-immich-primary/10 text-immich-primary dark:bg-immich-dark-primary/15 dark:text-immich-dark-primary'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    <Icon icon={mdiFlashOutline} size="20" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <CardTitle class="truncate font-semibold text-dark group-hover:text-primary">
                        {workflow.name || $t('workflow')}
                      </CardTitle>

                      {#if !workflow.enabled}
                        <Badge size="small" color="secondary">
                          {$t('disabled')}
                        </Badge>
                      {/if}
                    </div>

                    {#if workflow.description}
                      <CardDescription class="mt-0.5 truncate">
                        {workflow.description}
                      </CardDescription>
                    {/if}
                  </div>

                  <ContextMenuButton
                    position="top-left"
                    items={[
                      ToggleEnabled,
                      Edit,
                      Duplicate,
                      Logs,
                      getWorkflowShowSchemaAction($t, expandedIds.has(workflow.id), () => onToggleExpand(workflow.id)),
                      MenuItemType.Divider,
                      Delete,
                    ]}
                  />
                </a>

                {#if expandedIds.has(workflow.id)}
                  {#await getWorkflowForShare({ id: workflow.id }) then result}
                    <div class="border-t border-gray-200 p-4 dark:border-gray-800">
                      <CodeBlock code={JSON.stringify(result, null, 2)} lineNumbers />
                      <Button
                        class="mt-2"
                        leadingIcon={mdiClose}
                        fullWidth
                        variant="ghost"
                        color="secondary"
                        onclick={() => onToggleExpand(workflow.id)}
                      >
                        {$t('close')}
                      </Button>
                    </div>
                  {/await}
                {/if}
              </CardHeader>
            </Card>
          {/each}
        </div>
      {/if}
    </Container>
  </section>
</UserPageLayout>
