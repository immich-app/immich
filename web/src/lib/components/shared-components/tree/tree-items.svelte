<script lang="ts">
  import Tree from '$lib/components/shared-components/tree/tree.svelte';
  import { normalizeTreePath, type RecursiveObject } from '$lib/utils/tree-utils';

  export let items: RecursiveObject;
  export let parent = '';
  export let active = '';
  export let icons: { default: string; active: string };
  export let getLink: (path: string) => string;
  export let getColor: (path: string) => string | undefined = () => undefined;
</script>

<ul class="list-none ml-2">
  {#each Object.entries(items) as [path, tree]}
    {@const value = normalizeTreePath(`${parent}/${path}`)}
    {@const key = value + getColor(value)}
    {#key key}
      <li>
        <Tree {parent} value={path} {tree} {icons} {active} {getLink} {getColor} />
      </li>
    {/key}
  {/each}
</ul>
