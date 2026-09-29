<script lang="ts">
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import { getTriggerDescription, getTriggerName } from '$lib/utils/workflow';
  import { WorkflowTrigger } from '@immich/sdk';
  import { FormModal, ListButton, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    selected?: WorkflowTrigger;
    onClose: (trigger?: WorkflowTrigger) => void;
  };

  const { selected: initialSelected, onClose }: Props = $props();

  let selected = $state(initialSelected);

  const onSubmit = () => onClose(selected);
</script>

<FormModal title={$t('trigger')} {onClose} {onSubmit} size="medium">
  <div class="flex flex-col gap-2">
    {#each pluginManager.triggers as item (item.trigger)}
      <ListButton selected={selected === item.trigger} onclick={() => (selected = item.trigger)}>
        <div class="grow text-start">
          <Text fontWeight="medium">{getTriggerName($t, item.trigger)}</Text>
          <Text size="tiny" color="muted">{getTriggerDescription($t, item.trigger)}</Text>
        </div>
      </ListButton>
    {/each}
  </div>
</FormModal>
