<script lang="ts">
  import { workflowTemplates, type WorkflowTemplate } from '$lib/templates/workflow-templates';
  import { FormModal, Icon, ListButton, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (template?: WorkflowTemplate) => void;
  };

  const { onClose }: Props = $props();

  let selected = $state<WorkflowTemplate>();

  const onSubmit = () => onClose(selected);
</script>

<FormModal title={$t('workflow_templates')} {onClose} {onSubmit} disabled={!selected} size="medium">
  <div class="flex flex-col gap-2">
    {#each workflowTemplates as template (template.id)}
      <ListButton selected={selected?.id === template.id} onclick={() => (selected = template)}>
        <div class="flex w-full items-center gap-3 text-start">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-immich-primary/10 text-immich-primary dark:bg-immich-dark-primary/15 dark:text-immich-dark-primary"
          >
            <Icon icon={template.icon} size="18" />
          </div>
          <div class="min-w-0 grow">
            <Text fontWeight="medium">{template.name}</Text>
            <Text size="tiny" color="muted">{template.description}</Text>
          </div>
        </div>
      </ListButton>
    {/each}
  </div>
</FormModal>
