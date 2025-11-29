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
  }

  let { title, icon, expanded = $bindable(false), children }: Props = $props();
</script>

<section class="group">
  <button
    type="button"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
    class={`flex w-full items-center gap-3 px-4 py-3 text-start bg-light-100 ${expanded ? '' : 'hover:bg-primary-50'}`}
  >
    <Icon {icon} size="20" class="shrink-0 transition-colors {expanded ? 'text-primary' : 'text-dark'}" />
    <span class="flex-1 text-sm font-medium transition-colors {expanded ? 'text-primary' : 'text-dark'}">
      {title}
    </span>
    <Icon
      icon={mdiChevronDown}
      size="20"
      class="transition-transform duration-200 {expanded ? 'text-primary rotate-180' : 'text-dark'}"
    />
  </button>

  {#if expanded}
    <div
      class="border-t border-gray-100 bg-white pt-4 pb-6 px-4 dark:border-neutral-700 dark:bg-neutral-900"
      transition:slide={{ duration: 150 }}
    >
      {@render children?.()}
    </div>
  {/if}
</section>
