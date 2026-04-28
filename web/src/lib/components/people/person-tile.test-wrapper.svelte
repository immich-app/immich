<script lang="ts">
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import { TooltipProvider } from '@immich/ui';
  import PersonTile from './person-tile.svelte';

  interface Props {
    person: ManagedPerson;
    showActionMenu?: boolean;
    showFooter?: boolean;
  }

  let { person, showActionMenu = false, showFooter = false }: Props = $props();
</script>

<TooltipProvider>
  <PersonTile {person} {showActionMenu}>
    {#snippet actionMenu()}
      {#if showActionMenu}
        <button type="button">Actions</button>
      {/if}
    {/snippet}

    {#snippet footer()}
      {#if showFooter}
        <p>Footer content</p>
      {/if}
    {/snippet}
  </PersonTile>
</TooltipProvider>
