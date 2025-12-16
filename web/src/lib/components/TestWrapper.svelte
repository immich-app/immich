<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import type { Component } from 'svelte';

  type Props<T extends Record<string, unknown>> = {
    component: Component<T>;
    componentProps: T;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { component: Test, componentProps }: Props<any> = $props();
</script>

<TooltipProvider>
  <Test {...componentProps} />
</TooltipProvider>
