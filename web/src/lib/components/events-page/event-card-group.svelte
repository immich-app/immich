<script lang="ts">
  import EventCard from '$lib/components/events-page/event-card.svelte';
  import { eventViewSettings } from '$lib/stores/preferences.store';
  import { isEventGroupCollapsed, toggleEventGroupCollapsing } from '$lib/utils/event-utils';
  import type { EventResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { fly } from 'svelte/transition';

  interface Props {
    eventGroup: {
      id: string;
      name: string;
      events: EventResponseDto[];
    };
  }

  let { eventGroup }: Props = $props();

  let isCollapsed = $derived(isEventGroupCollapsed($eventViewSettings, eventGroup.id));
</script>

<div id={`event-group-${eventGroup.id}`}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex gap-2 pt-5 pb-3 sticky top-0 md:top-[90px] z-[1] bg-immich-bg dark:bg-immich-dark-bg cursor-pointer"
    onclick={() => toggleEventGroupCollapsing($eventViewSettings, eventGroup.id)}
    onkeydown={(event) => event.key === 'Enter' && toggleEventGroupCollapsing($eventViewSettings, eventGroup.id)}
  >
    <p class="text-xs font-medium text-immich-fg/75 dark:text-immich-dark-fg/75 pt-1">
      {eventGroup.id}
    </p>
    <div class="w-full flex gap-2 items-center">
      <div class="transition-transform" class:rotate-90={!isCollapsed}>
        <Icon icon={mdiChevronRight} size="24" class="text-immich-fg/75 dark:text-immich-dark-fg/75" />
      </div>
      <p class="text-3xl font-medium text-immich-fg dark:text-immich-dark-fg">
        {eventGroup.name}
      </p>
    </div>
  </div>

  {#if !isCollapsed}
    <div
      in:fly={{ y: -200, duration: 300 }}
      class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 md:gap-6 pb-8"
    >
      {#each eventGroup.events as event (event.id)}
        <EventCard {event} />
      {/each}
    </div>
  {/if}
</div>
