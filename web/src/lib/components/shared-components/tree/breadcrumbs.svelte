<script lang="ts">
  import { TreeNode } from '$lib/utils/tree-utils';
  import { Icon, IconButton } from '@immich/ui';
  import { mdiArrowUpLeft, mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    node: TreeNode;
    getLink: (path: string) => string;
    title: string;
    icon: string;
  }

  const { node, getLink, title, icon }: Props = $props();

  const rootLink = getLink('');
  const isRoot = $derived(node.parent === null);
  const parentLink = $derived(getLink(node.parent ? node.parent.path : ''));
  const parents = $derived(node.parents);
</script>

<nav class="flex items-center py-2">
  {#if parentLink}
    <div>
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        icon={mdiArrowUpLeft}
        aria-label={$t('to_parent')}
        href={parentLink}
        class="me-2"
      />
    </div>
  {/if}

  <div
    class="bg-gray-50 dark:bg-immich-dark-gray/50 w-full p-2 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-y-auto immich-scrollbar"
  >
    <ol class="flex gap-2 items-center">
      <li>
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          {icon}
          href={rootLink}
          aria-label={title}
          size="medium"
          aria-current={isRoot ? 'page' : undefined}
        />
      </li>
      {#each parents as parent (parent)}
        <li class="flex gap-2 items-center font-mono text-sm text-nowrap text-primary">
          <Icon icon={mdiChevronRight} class="text-gray-500 dark:text-gray-300" size="16" aria-hidden />
          <a class="underline hover:font-semibold whitespace-pre-wrap" href={getLink(parent.path)}>
            {parent.value}
          </a>
        </li>
      {/each}

      <li class="flex gap-2 items-center font-mono text-sm text-nowrap text-primary">
        <Icon icon={mdiChevronRight} class="text-gray-500 dark:text-gray-300" size="16" aria-hidden />
        <p class="cursor-default whitespace-pre-wrap">{node.value}</p>
      </li>
    </ol>
  </div>
</nav>
