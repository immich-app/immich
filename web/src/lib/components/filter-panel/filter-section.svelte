<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    testId: string;
    children: Snippet;
    refetching?: boolean;
    count?: number;
  }

  let { title, testId, children, refetching = false, count }: Props = $props();
  let expanded = $state(true);

  let isEmpty = $derived(count === 0);
</script>

<div class="border-b border-gray-200 dark:border-gray-700" data-testid="filter-section-{testId}">
  <button
    type="button"
    class="flex w-full items-center justify-between px-4 py-3 hover:bg-subtle {isEmpty ? 'opacity-50' : ''}"
    onclick={() => {
      if (!isEmpty) {
        expanded = !expanded;
      }
    }}
    disabled={isEmpty}
  >
    <span class="text-sm font-medium">
      {title}{isEmpty ? ' (0)' : ''}
    </span>
    {#if !isEmpty}
      <Icon
        icon={mdiChevronDown}
        size="16"
        class="text-gray-500 transition-transform dark:text-gray-400 {expanded ? '' : '-rotate-90'}"
      />
    {/if}
  </button>
  {#if expanded && !isEmpty}
    <div class="filter-section-content px-4 pb-4" class:refetching>
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .filter-section-content {
    transition: opacity 0.2s ease 150ms;
  }
  .filter-section-content.refetching {
    opacity: 0.5;
  }
</style>
