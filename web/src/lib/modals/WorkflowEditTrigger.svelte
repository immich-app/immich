<script lang="ts">
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import { handleUpdateWorkflow } from '$lib/services/workflow.service';
  import { getTriggerDescription, getTriggerName } from '$lib/utils/workflow';
  import { type WorkflowResponseDto } from '@immich/sdk';
  import { FormModal, ListButton, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    workflow: WorkflowResponseDto;
    onClose: () => void;
  };

  const { workflow, onClose }: Props = $props();

  let selected = $state(pluginManager.getTrigger(workflow.trigger));

  const onSubmit = async () => {
    const success = await handleUpdateWorkflow(workflow.id, { trigger: selected.trigger });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('trigger')} {onClose} {onSubmit} size="small">
  <div class="flex flex-col gap-2">
    {#each pluginManager.triggers as item (item.trigger)}
      <ListButton selected={item.trigger === selected.trigger} onclick={() => (selected = item)}>
        <div class="grow text-start">
          <Text fontWeight="medium">{getTriggerName($t, item.trigger)}</Text>
          <Text size="tiny" color="muted">{getTriggerDescription($t, item.trigger)}</Text>
        </div>
      </ListButton>
    {/each}
  </div>
</FormModal>
