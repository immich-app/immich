<script lang="ts">
  import { goto } from '$app/navigation';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
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

  const handleSelect = (event: MouseEvent | KeyboardEvent, path: string) => {
    event.preventDefault();
    event.stopPropagation();
    navigateTo(path);
  };

  const handleKeydown = (event: KeyboardEvent, node: TreeNode) => {
    switch (event.key) {
      case 'Enter':
      case ' ': {
        handleSelect(event, node.path);

        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        event.stopPropagation();
        const hasChildren = node.children.length > 0;
        if (isOpen && hasChildren) {
          const target = event.target as HTMLElement;
          const child = target.querySelector<HTMLLIElement>('ul[role="group"] > li[role="treeitem"]');
          child?.focus();
        } else if (!isOpen && hasChildren) {
          isOpen = true;
        }

        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        event.stopPropagation();
        const hasChildren = node.children.length > 0;
        if (isOpen && hasChildren) {
          isOpen = false;
        } else if (node.parents.length > 0) {
          const target = event.target as HTMLElement;
          const parent = target.parentElement?.closest<HTMLLIElement>('li[role="treeitem"]');
          parent?.focus();
        }

        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        event.stopPropagation();
        console.log('focus previous node');

        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        event.stopPropagation();
        console.log('focus next node');

        break;
      }
    }
  };

  const navigateTo = (path: string) => {
    const link = getLink(path);
    void goto(link, { keepFocus: true });
  };
</script>

<!-- href={getLink(node.path)} -->
<li
  role="treeitem"
  aria-selected={false}
  tabindex="0"
  class="outline-none"
  onkeydown={(event) => handleKeydown(event, node)}
  onclick={(event) => handleSelect(event, node.path)}
>
  <div
    class={`flex grow place-items-center ps-2 py-1 text-sm rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-primary' : 'dark:text-gray-200'}`}
  >
    {#if node.size > 0}
      <button tabindex={-1} aria-hidden="true" type="button" {onclick}>
        <Icon icon={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size="20" />
      </button>
    {/if}
    <div class={node.size === 0 ? 'ml-[1.5em] ' : ''}>
      <Icon
        icon={isActive ? icons.active : icons.default}
        class={isActive ? 'text-primary' : 'text-gray-400'}
        color={node.color}
        size="20"
      />
    </div>
    <span class="text-nowrap overflow-hidden text-ellipsis font-mono ps-1 pt-1 whitespace-pre-wrap">{node.value}</span>
  </div>

  {#if isOpen}
    <TreeItems tree={node} {icons} {active} {getLink} isNested />
  {/if}
</li>

<style>
  li[role='treeitem']:focus-visible > div {
    outline-style: var(--tw-outline-style);
    outline-width: 2px;
  }
</style>
