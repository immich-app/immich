<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';
  import { TooltipProvider } from '@immich/ui';
  import ManagePeopleVisibility from './manage-people-visibility.svelte';

  interface Props {
    people: PersonResponseDto[];
    totalPeopleCount: number;
    titleId?: string | undefined;
    onClose: () => void;
    onUpdate: (people: PersonResponseDto[]) => void;
    loadNextPage: () => void;
  }

  let props: Props = $props();
</script>

<TooltipProvider>
  <ManagePeopleVisibility {...props} />
</TooltipProvider>
