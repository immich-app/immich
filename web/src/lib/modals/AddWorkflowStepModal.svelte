<script lang="ts">
  import type { PluginActionResponseDto, PluginFilterResponseDto } from '@immich/sdk';
  import { Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiFilterOutline, mdiPlayCircleOutline } from '@mdi/js';

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

<Modal title="Add Workflow Step" icon={false} onClose={() => onClose()}>
  <ModalBody>
    <div class="space-y-6">
      <!-- Filters Section -->
      {#if availableFilters.length > 0 && (!type || type === 'filter')}
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Icon icon={mdiFilterOutline} size="16" class="text-warning" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
          </div>
          <div class="grid grid-cols-1 gap-2">
            {#each availableFilters as filter (filter.id)}
              <button
                type="button"
                onclick={() => handleSelect('filter', filter)}
                class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-left"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm text-gray-900 dark:text-gray-100">{filter.title}</p>
                  {#if filter.description}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{filter.description}</p>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Actions Section -->
      {#if availableActions.length > 0 && (!type || type === 'action')}
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="h-6 w-6 rounded-md bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
              <Icon icon={mdiPlayCircleOutline} size="16" class="text-success" />
            </div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</h3>
          </div>
          <div class="grid grid-cols-1 gap-2">
            {#each availableActions as action (action.id)}
              <button
                type="button"
                onclick={() => handleSelect('action', action)}
                class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-left"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm text-gray-900 dark:text-gray-100">{action.title}</p>
                  {#if action.description}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
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
