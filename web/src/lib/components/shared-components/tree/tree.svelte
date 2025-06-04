<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { TreeNode } from '$lib/utils/tree-utils';
  import { mdiChevronDown, mdiChevronRight } from '@mdi/js';

  interface Props {
    node: TreeNode;
    active: string;
    icons: { default: string; active: string };
    getLink: (path: string) => string;
    getColor?: (path: string) => string | undefined;
  }

  let { node, active, icons, getLink, getColor }: Props = $props();

  const isTarget = $derived(active === node.path);
  const isActive = $derived(active === node.path || active.startsWith(`${node.path}/`) || (node.value === '/' && active.startsWith('/')));
  const color = $derived(getColor?.(node.path));
  let isOpen = $derived(isActive);

  const onclick = (event: MouseEvent) => {
    event.preventDefault();
    isOpen = !isOpen;
  };
</script>

<a
  href={getLink(node.path)}
  title={node.value}
  class={`flex grow place-items-center ps-2 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
  data-sveltekit-keepfocus
>
  {#if node.size > 0}
    <button type="button" {onclick}>
      <Icon path={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size={20} />
    </button>
  {/if}
  <div class={node.size === 0 ? 'ml-[1.5em] ' : ''}>
    <Icon
      path={isActive ? icons.active : icons.default}
      class={isActive ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400'}
      {color}
      size={20}
    />
  </div>
  <span class="text-nowrap overflow-hidden text-ellipsis font-mono ps-1 pt-1 whitespace-pre-wrap">{node.value}</span>
</a>

{#if isOpen}
  <TreeItems {node} {icons} {active} {getLink} {getColor} />
{/if}
