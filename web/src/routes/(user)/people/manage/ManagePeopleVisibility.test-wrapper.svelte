<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import type { ComponentProps } from 'svelte';
  import ManagePeoplePage from './+page.svelte';

  interface Props {
    data: ComponentProps<typeof ManagePeoplePage>['data'];
  }

  let { data }: Props = $props();
</script>

<TooltipProvider>
  <ManagePeoplePage {data} />
</TooltipProvider>
