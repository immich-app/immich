<script lang="ts">
  import { WorkflowTrigger, type WorkflowStepDto, type WorkflowUpdateDto } from '@immich/sdk';
  import {
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    Icon,
    Theme,
    themeManager,
    VStack,
  } from '@immich/ui';
  import { mdiCodeJson } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { untrack } from 'svelte';
  import { JSONEditor, Mode, type Content, type OnChangeStatus } from 'svelte-jsoneditor';
  import { t } from 'svelte-i18n';

  type WorkflowJsonContent = Required<
    Pick<WorkflowUpdateDto, 'description' | 'enabled' | 'name' | 'steps' | 'trigger'>
  >;

  type Props = {
    jsonContent: WorkflowJsonContent;
    onContentChange: (content: WorkflowJsonContent) => void;
  };

  let { jsonContent, onContentChange }: Props = $props();

  let content: Content = $state({ json: jsonContent });
  let editorClass = $derived(themeManager.value === Theme.Dark ? 'jse-theme-dark' : '');

  const isWorkflowStep = (value: unknown): value is WorkflowStepDto => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const step = value as Partial<WorkflowStepDto>;
    return (
      typeof step.method === 'string' &&
      (step.config === null || (typeof step.config === 'object' && !Array.isArray(step.config))) &&
      (step.enabled === undefined || typeof step.enabled === 'boolean')
    );
  };

  const isWorkflowJsonContent = (value: unknown): value is WorkflowJsonContent => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const workflow = value as Partial<WorkflowJsonContent>;
    return (
      typeof workflow.enabled === 'boolean' &&
      (workflow.name === null || typeof workflow.name === 'string') &&
      (workflow.description === null || typeof workflow.description === 'string') &&
      Object.values(WorkflowTrigger).includes(workflow.trigger as WorkflowTrigger) &&
      Array.isArray(workflow.steps) &&
      workflow.steps.every(isWorkflowStep)
    );
  };

  const parseContent = (updated: Content) => {
    if ('json' in updated) {
      return updated.json;
    }

    return JSON.parse(updated.text);
  };

  $effect(() => {
    const nextContent = jsonContent;
    let isSynced = false;

    try {
      isSynced = isEqual(
        untrack(() => parseContent(content)),
        nextContent,
      );
    } catch {
      // The editor can be temporarily invalid while typing in text mode.
    }

    if (!isSynced) {
      content = { json: nextContent };
    }
  });

  const handleChange = (updated: Content, _: Content, status: OnChangeStatus) => {
    if (status.contentErrors) {
      return;
    }

    const parsed = parseContent(updated);
    if (!isWorkflowJsonContent(parsed)) {
      return;
    }

    onContentChange(parsed);
  };
</script>

<VStack gap={4}>
  <Card>
    <CardHeader>
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <Icon icon={mdiCodeJson} size="20" class="mt-1" />
          <div class="flex flex-col">
            <CardTitle>{$t('workflow_json')}</CardTitle>
            <CardDescription>{$t('workflow_json_help')}</CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardBody>
      <VStack gap={2}>
        <div class="h-[600px] w-full overflow-hidden rounded-lg border {editorClass}">
          <JSONEditor bind:content onChange={handleChange} mainMenuBar={false} mode={Mode.text} />
        </div>
      </VStack>
    </CardBody>
  </Card>
</VStack>

<style>
  @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
</style>
