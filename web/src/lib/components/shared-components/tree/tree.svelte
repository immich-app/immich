<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { normalizeTreePath, type RecursiveObject } from '$lib/utils/tree-utils';
  import { mdiChevronDown, mdiChevronRight } from '@mdi/js';

  interface Props {
    tree: RecursiveObject;
    parent: string;
    value: string;
    active?: string;
    icons: { default: string; active: string };
    getLink: (path: string) => string;
    getColor: (path: string) => string | undefined;
  }

  let { tree, parent, value, active = '', icons, getLink, getColor }: Props = $props();

  const path = $derived(normalizeTreePath(`${parent}/${value}`));
  const isActive = $derived(active === path || active.startsWith(`${path}/`));
  const isTarget = $derived(active === path);
  const color = $derived(getColor(path));
  let isOpen = $derived(isActive);

  const onclick = (event: MouseEvent) => {
    event.preventDefault();
    isOpen = !isOpen;
  };
</script>

<a
  href={getLink(path)}
  title={value}
  class={`flex flex-grow place-items-center ps-2 py-1 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:font-semibold ${isTarget ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
  data-sveltekit-keepfocus
>
  <button type="button" {onclick} class={Object.values(tree).length === 0 ? 'invisible' : ''}>
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
  <span class="text-nowrap overflow-hidden text-ellipsis font-mono ps-1 pt-1 whitespace-pre-wrap">{value}</span>
</a>

{#if isOpen}
  <TreeItems parent={path} items={tree} {icons} {active} {getLink} {getColor} />
{/if}
