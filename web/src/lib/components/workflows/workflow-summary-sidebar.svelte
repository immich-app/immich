<script lang="ts">
  import type { PluginActionResponseDto, PluginFilterResponseDto, PluginTriggerResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight, mdiFilterOutline, mdiFlashOutline, mdiPlayCircleOutline } from '@mdi/js';

  interface Props {
    trigger: PluginTriggerResponseDto;
    filters: PluginFilterResponseDto[];
    actions: PluginActionResponseDto[];
  }

  let { trigger, filters, actions }: Props = $props();
</script>

<div class="fixed right-20 top-1/2 -translate-y-1/2 z-10 w-64">
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4">
    <h3 class="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Workflow Summary</h3>

    <div class="space-y-3">
      <!-- Trigger -->
      <div class="flex items-start gap-2">
        <div class="shrink-0 mt-0.5">
          <div class="h-6 w-6 rounded-md bg-indigo-100 dark:bg-primary/20 flex items-center justify-center">
            <Icon icon={mdiFlashOutline} size="16" class="text-primary" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{trigger.name}</p>
        </div>
      </div>

      <!-- Arrow -->
      {#if filters.length > 0}
        <div class="flex justify-center">
          <Icon icon={mdiChevronRight} size="20" class="text-gray-400 rotate-90" />
        </div>

        <!-- Filters -->
        <div class="flex items-start gap-2">
          <div class="shrink-0 mt-0.5">
            <div class="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Icon icon={mdiFilterOutline} size="16" class="text-warning" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="space-y-1">
              {#each filters as filter, index (filter.id)}
                <p class="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {index + 1}. {filter.title}
                </p>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Arrow -->
      {#if actions.length > 0}
        <div class="flex justify-center">
          <Icon icon={mdiChevronRight} size="20" class="text-gray-400 rotate-90" />
        </div>

        <!-- Actions -->
        <div class="flex items-start gap-2">
          <div class="shrink-0 mt-0.5">
            <div class="h-6 w-6 rounded-md bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
              <Icon icon={mdiPlayCircleOutline} size="16" class="text-success" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="space-y-1">
              {#each actions as action, index (action.id)}
                <p class="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {index + 1}. {action.title}
                </p>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
