<script lang="ts">
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { TooltipProvider } from '@immich/ui';
  import PeopleVisibilityModal from './people-visibility-modal.svelte';

  interface Props {
    people: VisibilityPerson[];
    onClose: () => void;
    onUpdate: (people: VisibilityPerson[]) => void;
    saveVisibilityChanges: (changes: VisibilityChange[]) => Promise<VisibilitySaveResult>;
    titleId?: string;
    totalPeopleCount?: number;
    gridClass?: string;
    personButtonClass?: string;
    personStyle?: string;
    hasMore?: boolean;
    loading?: boolean;
    loadNextPage?: () => void;
    deferThumbnails?: boolean;
    thumbnailConcurrency?: number;
  }

  let props: Props = $props();
</script>

<TooltipProvider>
  <PeopleVisibilityModal {...props} />
</TooltipProvider>
