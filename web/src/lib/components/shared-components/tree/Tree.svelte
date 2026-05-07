<script lang="ts">
  import TreeItems from '$lib/components/shared-components/tree/TreeItems.svelte';
  import { TreeNode } from '$lib/utils/tree-utils';
  import { Icon } from '@immich/ui';
  import { mdiChevronDown, mdiChevronRight } from '@mdi/js';

  interface Props {
    node: TreeNode;
    active: string;
    icons: { default: string; active: string };
    getLink: (path: string) => string;
  }

  let { node, active, icons, getLink }: Props = $props();

  const isTarget = $derived(active === node.path);
  const isActive = $derived(active === node.path || active.startsWith(node.value === '/' ? '/' : `${node.path}/`));
  let isOpen = $derived(isActive);

  const onclick = (event: MouseEvent) => {
    event.preventDefault();
    isOpen = !isOpen;
  };
</script>

<a
  href={getLink(node.path)}
  title={node.value}
  class={`flex grow place-items-center rounded-lg py-1 ps-2 text-sm hover:bg-slate-200 hover:font-semibold dark:hover:bg-slate-800 ${isTarget ? 'bg-slate-100 font-semibold text-primary dark:bg-slate-700' : 'dark:text-gray-200'}`}
  data-sveltekit-keepfocus
>
  {#if node.size > 0}
    <button type="button" {onclick}>
      <Icon icon={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size="20" />
    </button>
  {/if}
  <div class={node.size === 0 ? 'ml-[1.5em]' : ''}>
    <Icon
      icon={isActive ? icons.active : icons.default}
      class={isActive ? 'text-primary' : 'text-gray-400'}
      color={node.color}
      size="20"
    />
  </div>
  <span class="overflow-hidden ps-1 pt-1 font-mono text-nowrap text-ellipsis whitespace-pre-wrap">{node.value}</span>
</a>

{#if isOpen}
  <TreeItems tree={node} {icons} {active} {getLink} />
{/if}
