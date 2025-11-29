<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    title: string;
    icon: string;
    expanded?: boolean;
    children?: Snippet;
    isFirst?: boolean;
    isLast?: boolean;
  }

  let { title, icon, expanded = $bindable(false), children, isFirst = false, isLast = false }: Props = $props();
</script>

<div
  class="border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200"
  class:rounded-t-2xl={isFirst}
  class:rounded-b-2xl={isLast}
>
  <button
    type="button"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
    class="flex w-full items-center justify-between gap-3 px-4 py-3 text-start bg-light-50 hover:bg-primary-50 dark:hover:bg-gray-800 transition-colors"
    class:bg-light-200={expanded}
  >
    <div class="flex items-center gap-3">
      <div
        class="flex items-center justify-center w-8 h-8 rounded-lg bg-immich-primary/10 dark:bg-immich-dark-primary/20"
      >
        <Icon {icon} size="18" class="text-immich-primary dark:text-immich-dark-primary" />
      </div>
      <span class="font-medium text-gray-900 dark:text-gray-100">{title}</span>
    </div>

    <div
      class="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      <Icon
        icon={mdiChevronDown}
        size="20"
        class="text-gray-500 dark:text-gray-400 transition-transform duration-200 {expanded ? 'rotate-180' : ''}"
      />
    </div>
  </button>

  {#if expanded}
    <div transition:slide={{ duration: 150 }} class="px-4 py-4">
      {@render children?.()}
    </div>
  {/if}
</div>
