<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import { Card, CardBody, CardHeader, CardTitle, Icon, type ActionItem, type IconLike } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    icon: IconLike;
    title: string;
    headerAction?: ActionItem;
    children?: Snippet;
  };

  const { icon, title, headerAction, children }: Props = $props();
</script>

<Card color="secondary">
  <CardHeader>
    <div class="flex w-full justify-between items-center px-4 py-2">
      <div class="flex gap-2 text-primary">
        <Icon {icon} size="1.5rem" />
        <CardTitle>{title}</CardTitle>
      </div>
      {#if headerAction}
        <HeaderActionButton action={headerAction} />
      {/if}
    </div>
  </CardHeader>
  <CardBody>
    <div class="px-4 pb-7">
      {@render children?.()}
    </div>
  </CardBody>
</Card>
