<script lang="ts">
  import type { SharedSpacePersonResponseDto } from '@immich/sdk';
  import { TooltipProvider } from '@immich/ui';
  import ManageSpacePeopleVisibility from './manage-space-people-visibility.svelte';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    onClose: () => void;
    onUpdate: (people: SharedSpacePersonResponseDto[]) => void;
  }

  let props: Props = $props();
</script>

<TooltipProvider>
  <ManageSpacePeopleVisibility {...props} />
</TooltipProvider>
