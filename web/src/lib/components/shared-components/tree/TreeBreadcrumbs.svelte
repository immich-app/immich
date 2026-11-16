<script lang="ts">
  import { languageManager } from '#lib/managers/language-manager.svelte.ts';
  import { TreeNode } from '#lib/utils/tree-utils.ts';
  import { Breadcrumbs, ControlBar, ControlBarHeader, IconButton } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiArrowUpLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    node: TreeNode;
    getLink: (path: string) => string;
    title: string;
    icon: string;
    previousRoute?: string;
  };

  let { node, getLink, title, icon, previousRoute }: Props = $props();

  const items = $derived([
    { icon, title, href: getLink('') },
    ...node.parents.map((parent) => ({ title: parent.value, href: getLink(parent.path) })),
    { title: node.value },
  ]);
</script>

<ControlBar>
  <ControlBarHeader class="flex-row gap-4">
    {#if previousRoute}
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        icon={languageManager.rtl ? mdiArrowRight : mdiArrowLeft}
        aria-label={$t('back')}
        href={previousRoute}
      />
    {/if}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      icon={mdiArrowUpLeft}
      aria-label={$t('to_parent')}
      href={node.parent ? getLink(node.parent.path) : undefined}
      disabled={!node.parent}
    />
    <Breadcrumbs {items} class="[&_a]:text-primary" />
  </ControlBarHeader>
</ControlBar>
