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
    Button,
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeBlock,
    Container,
    Icon,
    IconButton,
    MenuItemType,
    menuManager,
  } from '@immich/ui';
  import { mdiClose, mdiDotsVertical, mdiFlashOutline } from '@mdi/js';
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
        <div class="my-6 flex flex-col gap-3">
          {#each workflows as workflow (workflow.id)}
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
                        <span
                          class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {$t('disabled')}
                        </span>
                      {/if}
                    </div>

                    {#if workflow.description}
                      <CardDescription class="mt-0.5 truncate">
                        {workflow.description}
                      </CardDescription>
                    {/if}
                  </div>

                  <IconButton
                    shape="round"
                    variant="ghost"
                    color="secondary"
                    icon={mdiDotsVertical}
                    aria-label={$t('menu')}
                    onclick={(event: MouseEvent) => {
                      event.preventDefault();
                      event.stopPropagation();
                      showWorkflowMenu(event, workflow);
                    }}
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
                        onclick={() => toggleExpanded(workflow.id)}
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
