<script lang="ts">
  import Tree from '$lib/components/shared-components/tree/tree.svelte';
  import { type TreeNode } from '$lib/utils/tree-utils';

  interface Props {
    tree: TreeNode;
    active: string;
    icons: { default: string; active: string };
    getLink: (path: string) => string;
    isNested?: boolean;
  }

  let { tree, active, icons, getLink, isNested = false }: Props = $props();
</script>

<ul role={isNested ? 'group' : 'tree'} class="list-none ms-2">
  {#each tree.children as node (node.color ? node.path + node.color : node.path)}
    <Tree {node} {icons} {active} {getLink} />
  {/each}
</ul>
