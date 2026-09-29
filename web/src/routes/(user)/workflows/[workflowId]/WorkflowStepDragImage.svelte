<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiAutoFix, mdiFilterVariant } from '@mdi/js';

  type Props = {
    description?: string;
    isFilter: boolean;
    label: string;
    stepNumber: number;
  };

  let { description, isFilter, label, stepNumber }: Props = $props();
</script>

<div
  id="workflow-step-drag-image"
  aria-hidden="true"
  class="pointer-events-none fixed top-[-1000px] left-0 flex w-80 items-center gap-2.5 rounded-lg border border-light-200 bg-light px-3 py-2.5 text-sm/5 text-dark shadow-2xl"
>
  <div
    class="flex size-8 shrink-0 items-center justify-center rounded-lg"
    class:bg-primary-50={isFilter}
    class:bg-warning-50={!isFilter}
  >
    <Icon
      icon={isFilter ? mdiFilterVariant : mdiAutoFix}
      size="18"
      class={isFilter ? 'text-primary' : 'text-warning'}
    />
  </div>

  <div class="min-w-0 flex-1">
    <div class="flex min-w-0 items-center gap-2">
      <span class="shrink-0 font-bold text-light-500">#{stepNumber}</span>
      <span class="truncate font-bold">{label}</span>
    </div>

    {#if description}
      <div class="mt-0.5 truncate text-xs/4 text-light-500">{description}</div>
    {/if}
  </div>
</div>
