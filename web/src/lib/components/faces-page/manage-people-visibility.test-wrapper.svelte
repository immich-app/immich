<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';
  import { TooltipProvider } from '@immich/ui';
  import ManagePeopleVisibility from './manage-people-visibility.svelte';

  interface Props {
    people: PersonResponseDto[];
    totalPeopleCount: number;
    titleId?: string | undefined;
    onClose: () => void;
    loadNextPage: () => void;
  }

  let { people, totalPeopleCount, titleId = undefined, onClose, loadNextPage }: Props = $props();
</script>

<TooltipProvider>
  <ManagePeopleVisibility {people} {totalPeopleCount} {titleId} {onClose} {loadNextPage} />
</TooltipProvider>
