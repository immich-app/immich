<script lang="ts">
  import type { PluginActionResponseDto, PluginFilterResponseDto } from '@immich/sdk';
  import { Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiFilterOutline, mdiPlayCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: PluginFilterResponseDto[];
    actions: PluginActionResponseDto[];
    addedFilters?: PluginFilterResponseDto[];
    addedActions?: PluginActionResponseDto[];
    onClose: (result?: { type: 'filter' | 'action'; item: PluginFilterResponseDto | PluginActionResponseDto }) => void;
    type?: 'filter' | 'action';
  }

  let { filters, actions, addedFilters = [], addedActions = [], onClose, type }: Props = $props();

  // Filter out already-added items
  const availableFilters = $derived(filters.filter((f) => !addedFilters.some((af) => af.id === f.id)));
  const availableActions = $derived(actions.filter((a) => !addedActions.some((aa) => aa.id === a.id)));

  type StepType = 'filter' | 'action';

  const handleSelect = (type: StepType, item: PluginFilterResponseDto | PluginActionResponseDto) => {
    onClose({ type, item });
  };
</script>

<Modal title={$t('add_workflow_step')} icon={false} onClose={() => onClose()}>
  <ModalBody>
    <div class="space-y-6">
      <!-- Filters Section -->
      {#if availableFilters.length > 0 && (!type || type === 'filter')}
        <div class="flex items-center gap-2 mb-3">
          <div class="h-6 w-6 rounded-md bg-warning-100 flex items-center justify-center">
            <Icon icon={mdiFilterOutline} size="16" class="text-warning" />
          </div>
          <h3 class="text-sm font-semibold">Filters</h3>
        </div>
        <div class="grid grid-cols-1 gap-2">
          {#each availableFilters as filter (filter.id)}
            <button
              type="button"
              onclick={() => handleSelect('filter', filter)}
              class="flex items-start gap-3 p-3 rounded-lg border bg-light-100 hover:border-warning-500 dark:hover:border-warning-500 text-left"
            >
              <div class="flex-1">
                <p class="font-medium text-sm">{filter.title}</p>
                {#if filter.description}
                  <p class="text-xs text-light-500 mt-1">{filter.description}</p>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Actions Section -->
      {#if availableActions.length > 0 && (!type || type === 'action')}
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="h-6 w-6 rounded-md bg-success-50 flex items-center justify-center">
              <Icon icon={mdiPlayCircleOutline} size="16" class="text-success" />
            </div>
            <h3 class="text-sm font-semibold">Actions</h3>
          </div>
          <div class="grid grid-cols-1 gap-2">
            {#each availableActions as action (action.id)}
              <button
                type="button"
                onclick={() => handleSelect('action', action)}
                class="flex items-start gap-3 p-3 rounded-lg border bg-light-100 hover:border-success-500 dark:hover:border-success-500 text-left"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm">{action.title}</p>
                  {#if action.description}
                    <p class="text-xs text-light-500 mt-1">{action.description}</p>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </ModalBody>
</Modal>
