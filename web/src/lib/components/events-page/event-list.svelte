<script lang="ts">
  import EventCard from '$lib/components/events-page/event-card.svelte';
  import type { EventResponseDto } from '@immich/sdk';

  interface Props {
    events: EventResponseDto[];
  }

  let { events }: Props = $props();
</script>

<div class="grid w-full gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
  {#each events as event (event.id)}
    <EventCard {event} />
  {/each}
</div>
