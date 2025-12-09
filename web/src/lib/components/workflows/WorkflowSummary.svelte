<script lang="ts">
  import {
    PluginTriggerType,
    type PluginActionResponseDto,
    type PluginFilterResponseDto,
    type PluginTriggerResponseDto,
  } from '@immich/sdk';
  import { Icon, IconButton, Text } from '@immich/ui';
  import { mdiClose, mdiFilterOutline, mdiFlashOutline, mdiPlayCircleOutline, mdiViewDashboardOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    trigger: PluginTriggerResponseDto;
    filters: PluginFilterResponseDto[];
    actions: PluginActionResponseDto[];
  };

  let { trigger, filters, actions }: Props = $props();

  const getTriggerName = (triggerType: PluginTriggerType) => {
    switch (triggerType) {
      case PluginTriggerType.AssetCreate: {
        return $t('trigger_asset_uploaded');
      }
      case PluginTriggerType.PersonRecognized: {
        return $t('trigger_person_recognized');
      }
      default: {
        return triggerType;
      }
    }
  };

  let isOpen = $state(false);
  let position = $state({ x: 0, y: 0 });
  let isDragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });
  let containerEl: HTMLDivElement | undefined = $state();

  const handleMouseDown = (e: MouseEvent) => {
    if (!containerEl) {
      return;
    }
    isDragging = true;
    const rect = containerEl.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) {
      return;
    }
    position = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };
  };

  const handleMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  $effect(() => {
    // Initialize position to bottom-right on mount
    if (globalThis.window && position.x === 0 && position.y === 0) {
      position = {
        x: globalThis.innerWidth - 280,
        y: globalThis.innerHeight - 400,
      };
    }
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={containerEl}
    class="hidden sm:block fixed w-64 hover:cursor-grab select-none"
    style="left: {position.x}px; top: {position.y}px;"
    class:cursor-grabbing={isDragging}
    onmousedown={handleMouseDown}
  >
    <div
      class="rounded-xl border-transparent border-2 hover:shadow-xl hover:border-dashed bg-light-50 shadow-sm p-4 hover:border-light-300 transition-all"
    >
      <div class="flex items-center justify-between mb-4 cursor-grab select-none">
        <Text size="small" class="font-semibold">{$t('workflow_summary')}</Text>
        <div class="flex items-center gap-1">
          <IconButton
            icon={mdiClose}
            size="small"
            variant="ghost"
            color="secondary"
            title="Close summary"
            aria-label="Close summary"
            onclick={(e: MouseEvent) => {
              e.stopPropagation();
              isOpen = false;
            }}
          />
        </div>
      </div>

      <div class="space-y-2">
        <!-- Trigger -->
        <div class="rounded-lg bg-light-100 border p-3">
          <div class="flex items-center gap-2 mb-1">
            <Icon icon={mdiFlashOutline} size="18" class="text-primary" />
            <span class="text-[10px] font-semibold uppercase tracking-wide">{$t('trigger')}</span>
          </div>
          <p class="text-sm truncate pl-5">{getTriggerName(trigger.type)}</p>
        </div>

        <!-- Connector -->
        <div class="flex justify-center">
          <div class="w-0.5 h-3 bg-light-400"></div>
        </div>

        <!-- Filters -->
        {#if filters.length > 0}
          <div class="rounded-lg bg-light-100 border p-3">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon={mdiFilterOutline} size="18" class="text-warning" />
              <span class="text-[10px] font-semibold uppercase tracking-wide">{$t('filters')}</span>
            </div>
            <div class="space-y-1 pl-5">
              {#each filters as filter, index (index)}
                <div class="flex items-center gap-2">
                  <span
                    class="shrink-0 h-4 w-4 rounded-full bg-light-200 text-[10px] font-medium flex items-center justify-center"
                    >{index + 1}</span
                  >
                  <p class="text-sm truncate">{filter.title}</p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Connector -->
          <div class="flex justify-center">
            <div class="w-0.5 h-3 bg-light-400"></div>
          </div>
        {/if}

        <!-- Actions -->
        {#if actions.length > 0}
          <div class="rounded-lg bg-light-100 border p-3">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon={mdiPlayCircleOutline} size="18" class="text-success" />
              <span class="text-[10px] font-semibold uppercase tracking-wide">{$t('actions')}</span>
            </div>
            <div class="space-y-1 pl-5">
              {#each actions as action, index (index)}
                <div class="flex items-center gap-2">
                  <span
                    class="shrink-0 h-4 w-4 rounded-full bg-light-200 text-[10px] font-medium flex items-center justify-center"
                    >{index + 1}</span
                  >
                  <p class="text-sm truncate">{action.title}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <button
    type="button"
    class="hidden sm:flex fixed right-6 bottom-6 h-14 w-14 items-center justify-center rounded-full bg-primary text-light shadow-lg hover:bg-primary/90 transition-colors"
    title={$t('workflow_summary')}
    onclick={() => (isOpen = true)}
  >
    <Icon icon={mdiViewDashboardOutline} size="24" />
  </button>
{/if}
