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
    class="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2 bg-gray-50 dark:bg-immich-dark-gray/50 rounded-2xl border border-gray-100 dark:border-gray-900"
  >
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each items as item}
      <button
        class="flex flex-col place-items-center gap-2 py-2 px-4 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/40 rounded-xl"
        onclick={() => onClick(item.value)}
        title={item.value}
        type="button"
      >
        <Icon {icon} class="text-primary" size="64" />
        <p class="text-sm dark:text-gray-200 text-nowrap text-ellipsis overflow-clip w-full whitespace-pre-wrap">
          {item.value}
        </p>
      </button>
    {/each}
  </div>
{/if}
