<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { normalizeTreePath, type RecursiveObject } from '$lib/utils/tree-utils';
  import { mdiChevronDown, mdiChevronRight } from '@mdi/js';

  export let tree: RecursiveObject;
  export let parent: string;
  export let value: string;
  export let active = '';
  export let icons: { default: string; active: string };
  export let getLink: (path: string) => string;
  export let getColor: (path: string) => string | undefined;

  $: path = normalizeTreePath(`${parent}/${value}`);
  $: isActive = active === path || active.startsWith(`${path}/`);
  $: isOpen = isActive;
  $: isTarget = active === path;
  $: color = getColor(path);
</script>

<a
  href={getLink(path)}
  title={value}
  class={`flex flex-grow place-items-center pl-2 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
>
  <button
    type="button"
    on:click|preventDefault={() => (isOpen = !isOpen)}
    class={Object.values(tree).length === 0 ? 'invisible' : ''}
  >
    <Icon path={isOpen ? mdiChevronDown : mdiChevronRight} class="text-gray-400" size={20} />
  </button>
  <div>
    <Icon
      path={isActive ? icons.active : icons.default}
      class={isActive ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400'}
      {color}
      size={20}
    />
  </div>
  <span class="text-nowrap overflow-hidden text-ellipsis font-mono pl-1 pt-1">{value}</span>
</a>

{#if isOpen}
  <TreeItems parent={path} items={tree} {icons} {active} {getLink} {getColor} />
{/if}
