<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
  import { handleCreateWorkflow } from '$lib/services/workflow.service';
  import { WorkflowTrigger, type WorkflowResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Textarea, VStack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    workflow: WorkflowResponseDto;
    onClose: () => void;
  };

  const { workflow, onClose }: Props = $props();

  let name = $state(workflow.name ?? '');
  let description = $state(workflow.description ?? '');
  let trigger = $state<WorkflowTrigger>(workflow.trigger);

  const onSubmit = async () => {
    const response = await handleCreateWorkflow({
      name,
      description,
      trigger,
      steps: workflow.steps,
      enabled: false,
    });

    if (response) {
      await goto(Route.viewWorkflow({ id: response.id }));
      onClose();
    }
  };
</script>

<FormModal
  title={$t('duplicate_workflow')}
  {onClose}
  {onSubmit}
  disabled={!name || !trigger}
  size="medium"
  submitText={$t('create')}
>
  <VStack gap={4}>
    <Field label={$t('name')} required>
      <Input placeholder={$t('workflow_name')} bind:value={name} />
    </Field>

    <Field label={$t('description')}>
      <Textarea grow placeholder={$t('workflow_description')} bind:value={description} />
    </Field>
  </VStack>
</FormModal>
