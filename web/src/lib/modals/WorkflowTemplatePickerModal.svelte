<script lang="ts">
  import { goto } from '$app/navigation';
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import { executeMutation } from '$lib/queries/client';
  import { createWorkflowMutation } from '$lib/queries/workflow.query';
  import { Route } from '$lib/route';
  import { type PluginTemplateResponseDto } from '@immich/sdk';
  import { Badge, FormModal, Icon, ListButton, Text } from '@immich/ui';
  import { mdiFlashOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();

  let selected = $state<PluginTemplateResponseDto>();

  const onSubmit = async () => {
    if (!selected) {
      return;
    }

    const { trigger, steps, title: name, description } = selected;
    const workflowCreateDto = { trigger, steps, name, description, enabled: false };

    await executeMutation(createWorkflowMutation, [{ workflowCreateDto }], {
      onSuccess: (response) => {
        onClose();
        void goto(Route.viewWorkflow(response));
      },
    });
  };

  const isSelected = (template: PluginTemplateResponseDto) => selected?.key === template.key;
</script>

<FormModal
  title={$t('workflow_templates')}
  {onClose}
  {onSubmit}
  disabled={!selected}
  size="medium"
  submitText={$t('use_template')}
>
  <div class="flex flex-col gap-2">
    {#each pluginManager.templates as template (template.key)}
      <ListButton
        selected={isSelected(template)}
        onclick={() => (selected = isSelected(template) ? undefined : template)}
      >
        <div class="flex w-full items-center gap-3 text-start">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-immich-primary/10 text-immich-primary dark:bg-immich-dark-primary/15 dark:text-immich-dark-primary"
          >
            <Icon icon={mdiFlashOutline} size="18" />
          </div>
          <div class="min-w-0 grow">
            <Text fontWeight="medium">{template.title}</Text>
            <Text size="tiny" color="muted">{template.description}</Text>
          </div>
          {#if template.uiHints.includes('SmartAlbum')}
            <div class="shrink-0">
              <Badge size="small">{$t('smart_album')}</Badge>
            </div>
          {/if}
        </div>
      </ListButton>
    {/each}
  </div>
</FormModal>
