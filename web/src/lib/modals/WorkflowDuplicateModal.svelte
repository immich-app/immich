<script lang="ts">
  import { goto } from '$app/navigation';
  import { executeMutation } from '$lib/queries/client';
  import { createWorkflowMutation } from '$lib/queries/workflow.query';
  import { Route } from '$lib/route';
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
    await executeMutation(
      createWorkflowMutation,
      [{ workflowCreateDto: { name, description, trigger, steps: workflow.steps, enabled: false } }],
      {
        onSuccess: (response) => {
          onClose();
          void goto(Route.viewWorkflow(response));
        },
      },
    );
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
