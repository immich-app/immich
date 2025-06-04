<script lang="ts">
  import Tree from '$lib/components/shared-components/tree/tree.svelte';
  import { type TreeNode } from '$lib/utils/tree-utils';

  interface Props {
    node: TreeNode;
    active: string;
    icons: { default: string; active: string };
    getLink: (path: string) => string;
    getColor?: (path: string) => string | undefined;
  }

  let { node, active, icons, getLink, getColor }: Props = $props();
</script>

<ul class="list-none ms-2">
  {#each node.children as childNode (getColor ? childNode.path + getColor(childNode.path) : childNode.path)}
    <li>
      <Tree node={childNode} {icons} {active} {getLink} {getColor} />
    </li>
  {/each}
</ul>
