<script lang="ts">
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import type { WorkflowPayload } from '$lib/services/workflow.service';
  import { Button, Card, CardBody, CardDescription, CardHeader, CardTitle, Icon, VStack } from '@immich/ui';
  import { mdiCodeJson } from '@mdi/js';
  import { JSONEditor, Mode, type Content, type OnChangeStatus } from 'svelte-jsoneditor';

  type Props = {
    jsonContent: WorkflowPayload;
    onApply: () => void;
    onContentChange: (content: WorkflowPayload) => void;
  };

  let { jsonContent, onApply, onContentChange }: Props = $props();

  let content: Content = $derived({ json: jsonContent });
  let canApply = $state(false);
  let editorClass = $derived(themeManager.isDark ? 'jse-theme-dark' : '');

  const handleChange = (updated: Content, _: Content, status: OnChangeStatus) => {
    if (status.contentErrors) {
      return;
    }

    canApply = true;

    if ('text' in updated && updated.text !== undefined) {
      try {
        const parsed = JSON.parse(updated.text);
        onContentChange(parsed);
      } catch (error_) {
        console.error('Invalid JSON in text mode:', error_);
      }
    }
  };

  const handleApply = () => {
    onApply();
    canApply = false;
  };
</script>

<VStack gap={4}>
  <Card>
    <CardHeader>
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <Icon icon={mdiCodeJson} size="20" class="mt-1" />
          <div class="flex flex-col">
            <CardTitle>Workflow JSON</CardTitle>
            <CardDescription>Edit the workflow configuration directly in JSON format</CardDescription>
          </div>
        </div>
        <Button size="small" color="primary" onclick={handleApply} disabled={!canApply}>Apply Changes</Button>
      </div>
    </CardHeader>
    <CardBody>
      <VStack gap={2}>
        <div class="w-full h-[600px] rounded-lg overflow-hidden border {editorClass}">
          <JSONEditor {content} onChange={handleChange} mainMenuBar={false} mode={Mode.text} />
        </div>
      </VStack>
    </CardBody>
  </Card>
</VStack>

<style>
  @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
</style>
