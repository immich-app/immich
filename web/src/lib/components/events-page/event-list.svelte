<script lang="ts">
  import EventCard from '$lib/components/events-page/event-card.svelte';
  import type { EventResponseDto } from '@immich/sdk';

  interface Props {
    events: EventResponseDto[];
  }

  let { events }: Props = $props();
</script>

<div class="grid w-full gap-3 sm:gap-4 md:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {#each events as event (event.id)}
    <EventCard {event} />
  {/each}
</div>
