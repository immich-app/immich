<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SchemaFormFields from '$lib/components/workflow/schema-form/SchemaFormFields.svelte';
  import WorkflowCardConnector from '$lib/components/workflows/workflow-card-connector.svelte';
  import WorkflowTriggerCard from '$lib/components/workflows/workflow-trigger-card.svelte';
  import type { PluginResponseDto } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeBlock,
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

  let plugins = $state<PluginResponseDto[]>(data.plugins);
  let triggers = data.triggers;
  let filters = plugins.flatMap((plugin) => plugin.filters);
  let action = plugins.flatMap((plugin) => plugin.actions);

  let previousWorkflow = data.workflow;
  let editWorkflow = $state(data.workflow);

  let name: string = $state(editWorkflow.name ?? '');
  let description: string = $state(editWorkflow.description ?? '');

  let selectedTrigger = $state(triggers.find((t) => t.triggerType === editWorkflow.triggerType) ?? triggers[0]);
  let triggerType = $derived(selectedTrigger.triggerType);

  let supportFilters = $derived(filters.filter((filter) => filter.supportedContexts.includes(selectedTrigger.context)));
  let supportActions = $derived(action.filter((action) => action.supportedContexts.includes(selectedTrigger.context)));
  $effect(() => {
    editWorkflow.triggerType = triggerType;
  });

  const updateWorkflow = async () => {};

  let canSave: boolean = $derived(!isEqual(previousWorkflow, editWorkflow));

  let filterConfigs = $state({});
  let actionConfigs = $state({});

  $inspect(filterConfigs).with(console.log);
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
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

      <Card expandable expanded={true}>
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
          <div class="my-4">
            <p>Payload</p>
            <CodeBlock code={JSON.stringify(filterConfigs, null, 2)} lineNumbers></CodeBlock>
          </div>

          {#each supportFilters as filter (filter.id)}
            <h1 class="grid grid-cols-2 gap-4 font-bold mt-5 mb-2">{filter.title}</h1>

            <SchemaFormFields schema={filter.schema} bind:config={filterConfigs} configKey={filter.methodName} />
          {/each}
        </CardBody>
      </Card>

      <WorkflowCardConnector />

      <Card expandable>
        <CardHeader class="bg-teal-50 dark:bg-teal-950">
          <div class="flex items-start gap-3">
            <Icon icon={mdiPlayCircleOutline} size="20" class="mt-1 text-success" />
            <div class="flex flex-col">
              <CardTitle class="text-left text-success">Action</CardTitle>
              <CardDescription>A set of action to perform on the filtered assets</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <div class="my-4">
            <p>Payload</p>
            <CodeBlock code={JSON.stringify(actionConfigs, null, 2)} lineNumbers></CodeBlock>
          </div>

          {#each supportActions as action (action.id)}
            <h1 class="grid grid-cols-2 gap-4 font-bold">{action.title}</h1>
            <SchemaFormFields schema={action.schema} bind:config={actionConfigs} configKey={action.methodName} />
          {/each}
        </CardBody>
      </Card>
    </VStack>
  </Container>
</UserPageLayout>
