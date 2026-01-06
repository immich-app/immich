<script lang="ts">
  import type { PluginActionResponseDto, PluginFilterResponseDto } from '@immich/sdk';
  import { Modal, ModalBody, Text } from '@immich/ui';
  import { mdiFilterOutline, mdiPlayCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    filters: PluginFilterResponseDto[];
    actions: PluginActionResponseDto[];
    onClose: (result?: { type: 'filter' | 'action'; item: PluginFilterResponseDto | PluginActionResponseDto }) => void;
    type?: 'filter' | 'action';
  };

  let { filters, actions, onClose, type }: Props = $props();

  type StepType = 'filter' | 'action';

  const handleSelect = (type: StepType, item: PluginFilterResponseDto | PluginActionResponseDto) => {
    onClose({ type, item });
  };

  const getModalTitle = () => {
    if (type === 'filter') {
      return $t('add_filter');
    } else if (type === 'action') {
      return $t('add_action');
    } else {
      return $t('add_workflow_step');
    }
  };

  const getModalIcon = () => {
    if (type === 'filter') {
      return mdiFilterOutline;
    } else if (type === 'action') {
      return mdiPlayCircleOutline;
    } else {
      return false;
    }
  };
</script>

{#snippet stepButton(title: string, description?: string, onclick?: () => void)}
  <button
    type="button"
    {onclick}
    class="flex items-start gap-3 p-3 rounded-lg text-left bg-light-100 hover:border-primary border text-dark"
  >
    <div class="flex-1">
      <Text color="primary" class="font-medium">{title}</Text>
      {#if description}
        <Text size="small" class="mt-1">{description}</Text>
      {/if}
    </div>
  </button>
{/snippet}

<Modal title={getModalTitle()} icon={getModalIcon()} onClose={() => onClose()}>
  <ModalBody>
    <div class="space-y-6">
      <!-- Filters Section -->
      {#if filters.length > 0 && (!type || type === 'filter')}
        <div class="grid grid-cols-1 gap-2">
          {#each filters as filter (filter.id)}
            {@render stepButton(filter.title, filter.description, () => handleSelect('filter', filter))}
          {/each}
        </div>
      {/if}

      <!-- Actions Section -->
      {#if actions.length > 0 && (!type || type === 'action')}
        <div class="grid grid-cols-1 gap-2">
          {#each actions as action (action.id)}
            {@render stepButton(action.title, action.description, () => handleSelect('action', action))}
          {/each}
        </div>
      {/if}
    </div>
  </ModalBody>
</Modal>
