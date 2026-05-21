<script lang="ts">
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import type { WorkflowStepDto } from '@immich/sdk';
  import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle, Icon, IconButton } from '@immich/ui';
  import {
    mdiAutoFix,
    mdiDragVertical,
    mdiFilterVariant,
    mdiPencilOutline,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    step: WorkflowStepDto;
    index: number;
    isDragging: boolean;
    isDragHandleHovered: boolean;
    isDropTarget: boolean;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onDragStart: (index: number, event: DragEvent) => void;
    onDragEnd: () => void;
    onDragOver: (index: number, event: DragEvent) => void;
    onDragLeave: (index: number) => void;
    onDrop: (index: number, event: DragEvent) => void;
    onDragHandleEnter: (index: number) => void;
    onDragHandleLeave: () => void;
  };

  let {
    step,
    index,
    isDragging,
    isDragHandleHovered,
    isDropTarget,
    onEdit,
    onDelete,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragHandleEnter,
    onDragHandleLeave,
  }: Props = $props();

  const method = $derived(pluginManager.getMethod(step.method));
  const isFilter = $derived(method?.uiHints?.includes('filter') ?? false);
  const configEntries = $derived(
    Object.entries(step.config ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );

  const truncate = (input: string, max = 24) => (input.length > max ? input.slice(0, max - 1) + '…' : input);

  const formatConfigValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'on' : 'off';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      return `"${truncate(value)}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return $t('none');
      }
      const items = value.map((v) => (v !== null && typeof v === 'object' ? '{…}' : String(v)));
      const joined = items.join(' · ');
      if (joined.length <= 28) {
        return `"${joined}"`;
      }
      return $t('items_count', { values: { count: value.length } });
    }
    return '{…}';
  };
</script>

<div
  class="w-full transition-all"
  class:opacity-40={isDragging}
  class:scale-[0.99]={isDragging}
  ondragover={(event) => onDragOver(index, event)}
  ondragleave={() => onDragLeave(index)}
  ondrop={(event) => onDrop(index, event)}
  role="listitem"
>
  <Card
    class="shadow-none transition-colors {isDropTarget
      ? 'border-primary ring-2 ring-primary-200'
      : isDragHandleHovered
        ? 'border-dashed border-primary'
        : ''}"
  >
    <CardHeader>
      <div class="flex items-center gap-2">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex shrink-0 cursor-grab items-center justify-center rounded-md border border-transparent p-1 text-light-400 select-none hover:border-primary-200 hover:bg-primary-50 hover:text-primary active:cursor-grabbing"
          aria-label={$t('drag_to_reorder')}
          draggable="true"
          onmouseenter={() => onDragHandleEnter(index)}
          onmouseleave={onDragHandleLeave}
          ondragstart={(event) => onDragStart(index, event)}
          ondragend={onDragEnd}
          title={$t('drag_to_reorder')}
        >
          <Icon icon={mdiDragVertical} size="20" />
        </div>
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg"
          class:bg-primary-50={isFilter}
          class:bg-warning-50={!isFilter}
        >
          <Icon
            icon={isFilter ? mdiFilterVariant : mdiAutoFix}
            size="20"
            class={isFilter ? 'text-primary' : 'text-warning'}
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <CardTitle class="truncate">
            <span class="mr-1 font-bold text-light-500">{index + 1}</span>
            {pluginManager.getMethodLabel(step.method)}
          </CardTitle>
          {#if method?.description}
            <CardDescription class="truncate">{method.description}</CardDescription>
          {/if}
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <IconButton
            icon={mdiPencilOutline}
            aria-label={$t('edit')}
            variant="ghost"
            shape="round"
            color="secondary"
            size="small"
            onclick={() => onEdit(index)}
          />
          <IconButton
            icon={mdiTrashCanOutline}
            aria-label={$t('delete')}
            variant="ghost"
            shape="round"
            color="danger"
            size="small"
            onclick={() => onDelete(index)}
          />
        </div>
      </div>
    </CardHeader>

    {#if configEntries.length > 0}
      <CardBody class="py-3">
        <div class="flex flex-wrap items-center gap-1.5">
          {#each configEntries as [key, value] (key)}
            <Badge
              color={isFilter ? 'info' : 'warning'}
              shape="round"
              size="small"
              class="border font-mono {isFilter ? 'border-primary-200' : 'border-warning-200'}"
            >
              <span class="opacity-60">{key}</span>{formatConfigValue(value)}
            </Badge>
          {/each}
        </div>
      </CardBody>
    {/if}
  </Card>
</div>
