<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    testId: string;
    children: Snippet;
  }

  let { title, testId, children }: Props = $props();
  let expanded = $state(true);
</script>

<div class="border-b border-gray-200 dark:border-gray-700" data-testid="filter-section-{testId}">
  <button
    type="button"
    class="flex w-full items-center justify-between px-4 py-3 hover:bg-subtle"
    onclick={() => (expanded = !expanded)}
  >
    <span class="text-sm font-medium">
      {title}
    </span>
    <Icon
      icon={mdiChevronDown}
      size="16"
      class="text-gray-500 transition-transform dark:text-gray-400 {expanded ? '' : '-rotate-90'}"
    />
  </button>
  {#if expanded}
    <div class="px-4 pb-4">
      {@render children()}
    </div>
  {/if}
</div>
