<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import { Card, CardBody, CardHeader, CardTitle, Icon, type ActionItem, type IconLike } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    icon: IconLike;
    title: string;
    headerAction?: ActionItem;
    children?: Snippet;
    class?: string;
  };

  const { icon, title, headerAction, class: className, children }: Props = $props();
</script>

<Card color="secondary" class={className}>
  <CardHeader>
    <div class="flex w-full items-center justify-between px-4 py-2">
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
