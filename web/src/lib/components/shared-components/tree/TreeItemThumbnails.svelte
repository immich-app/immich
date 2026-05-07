<script lang="ts">
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { Icon } from '@immich/ui';

  interface Props {
    items: TreeNode[];
    icon: string;
    onClick: (path: string) => void;
  }

  let { items, icon, onClick }: Props = $props();
</script>

{#if items.length > 0}
  <div
    class="grid w-full grid-cols-2 gap-2 rounded-2xl border border-gray-100 bg-gray-50 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 dark:border-gray-900 dark:bg-immich-dark-gray/50"
  >
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each items as item}
      <button
        class="flex flex-col place-items-center gap-2 rounded-xl px-4 py-2 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/40"
        onclick={() => onClick(item.value)}
        title={item.value}
        type="button"
      >
        <Icon {icon} class="text-primary" size="64" />
        <p class="w-full overflow-clip text-sm text-nowrap text-ellipsis whitespace-pre-wrap dark:text-gray-200">
          {item.value}
        </p>
      </button>
    {/each}
  </div>
{/if}
