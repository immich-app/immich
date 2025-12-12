<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    subtitle?: string | Snippet;
    children?: Snippet;
  };

  const { title, subtitle, children }: Props = $props();
</script>

<Card class="dark:border-light-300" color="secondary">
  <CardHeader class="dark:border-light-300 px-5 pt-5">
    <Heading size="small" color="secondary" fontWeight="bold">{title}</Heading>
    <Text size="small" color="muted">
      {#if typeof subtitle === 'string'}
        {subtitle}
      {:else}
        {@render subtitle?.()}
      {/if}
    </Text>
  </CardHeader>
  <CardBody class="dark:border-light-300 px-5 pb-5">
    <div class="flex flex-col gap-5">
      {@render children?.()}
    </div>
  </CardBody>
</Card>
