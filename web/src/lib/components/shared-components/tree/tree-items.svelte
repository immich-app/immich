<script lang="ts">
  import Tree from '$lib/components/shared-components/tree/tree.svelte';
  import type { RecursiveObject } from '$lib/utils/tree-utils';

  export let items: RecursiveObject;
  export let parent = '';
  export let active = '';
  export let getLink: (path: string) => string;
</script>

<ul class="list-none ml-2">
  {#each Object.entries(items) as [path, tree], index (index)}
    <li>
      <Tree {parent} value={path} {tree} {active} {getLink} />
    </li>
  {/each}
</ul>
