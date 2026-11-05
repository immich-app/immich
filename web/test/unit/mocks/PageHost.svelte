<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
  import type { PageComponent } from './mock.ts';

  type Props = {
    component: PageComponent;
    data: unknown;
    params: Record<string, string>;
    client: QueryClient;
  };

  let { component: Page, data, params, client }: Props = $props();
</script>

<QueryClientProvider {client}>
  <TooltipProvider>
    <Page data={data as never} params={params as never} />
  </TooltipProvider>
</QueryClientProvider>
