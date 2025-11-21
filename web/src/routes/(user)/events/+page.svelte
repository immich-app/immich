<script lang="ts">
  import { goto } from '$app/navigation';
  import EventList from '$lib/components/events-page/event-list.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AppRoute } from '$lib/constants';
  import { Button } from '@immich/ui';
  import { mdiPlusBoxMultiple } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let events = $derived(data.events);

  const handleCreateEvent = (event?: Event) => {
    event?.preventDefault();
    void goto(`${AppRoute.EVENTS}/new`);
  };
</script>

<UserPageLayout class="pl-4" title={$t('events')} description={$t('events_description')}>
  {#snippet buttons()}
    <Button
      leadingIcon={mdiPlusBoxMultiple}
      size="small"
      variant="ghost"
      color="secondary"
      href={`${AppRoute.EVENTS}/new`}
      on:click={handleCreateEvent}
    >
      {$t('create_event')}
    </Button>
  {/snippet}

  <section class="px-4 sm:px-6 md:px-8 pt-20 md:pt-24 pb-10 max-w-6xl mx-auto w-full">
    {#if events.length === 0}
      <div class="flex justify-center">
        <EmptyPlaceholder
          text={$t('no_events_message')}
          title={$t('events')}
          fullWidth
          class="max-w-2xl"
          onClick={handleCreateEvent}
        />
      </div>
    {:else}
      <EventList {events} />
    {/if}
  </section>
</UserPageLayout>
