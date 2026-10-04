<script lang="ts">
  import { TreeNode } from '$lib/utils/tree-utils';
  import { Breadcrumbs, ControlBar, ControlBarHeader, IconButton } from '@immich/ui';
  import { mdiArrowUpLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    node: TreeNode;
    getLink: (path: string) => string;
    title: string;
    icon: string;
  };

  const { node, getLink, title, icon }: Props = $props();

  const items = $derived([
    { icon, title, href: getLink('') },
    ...node.parents.map((parent) => ({ title: parent.value, href: getLink(parent.path) })),
    { title: node.value },
  ]);
</script>

<ControlBar>
  <ControlBarHeader class="flex-row gap-4">
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
