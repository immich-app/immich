<script lang="ts">
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import AlbumsControls from '$lib/components/album-page/albums-controls.svelte';
  import Albums from '$lib/components/album-page/albums-list.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AppRoute } from '$lib/constants';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { AlbumFilter, albumViewSettings } from '$lib/stores/preferences.store';
  import { Button } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { event, ownedAlbums, sharedAlbums } = data;

  let searchQuery = $state('');
  let albumGroups: string[] = $state([]);

  // For non-owners (accessing through shared albums), only show All and Shared filters
  const availableFilters = $derived(event.isOwner ? Object.keys(AlbumFilter) : [AlbumFilter.All, AlbumFilter.Shared]);

  // If user is not owner and filter is set to Owned, default to Shared
  $effect(() => {
    if (!event.isOwner && $albumViewSettings.filter === AlbumFilter.Owned) {
      $albumViewSettings.filter = AlbumFilter.Shared;
    }
  });
</script>

<UserPageLayout
  title={event.eventName}
  description={event.description || undefined}
  scrollbar={false}
  use={[[scrollMemory, { routeStartsWith: `${AppRoute.EVENTS}/${event.id}` }]]}
>
  {#snippet buttons()}
    <div class="flex place-items-center gap-2">
      <AlbumsControls
        {albumGroups}
        bind:searchQuery
        eventId={event.id}
        eventName={event.eventName}
        isEventOwner={event.isOwner ?? true}
      />
    </div>
  {/snippet}

  <div class="flex items-left pb-4 pt-4 mb-2">
    <Button leadingIcon={mdiArrowLeft} size="small" color="secondary" href={AppRoute.EVENTS}>
      <span class="sm:inline">{$t('all_events')}</span>
    </Button>
  </div>

  <div class="xl:hidden flex items-center justify-between mb-4">
    <div class="w-fit h-10 dark:text-immich-dark-fg">
      <GroupTab
        label={$t('show_albums')}
        filters={availableFilters}
        selected={$albumViewSettings.filter}
        onSelect={(selected) => ($albumViewSettings.filter = selected)}
      />
    </div>
    <div class="sm:w-54 md:w-72 lg:w-90 ml-auto">
      <SearchBar placeholder={$t('search_albums')} bind:name={searchQuery} showLoadingSpinner={false} />
    </div>
  </div>

  <Albums
    {ownedAlbums}
    {sharedAlbums}
    userSettings={$albumViewSettings}
    allowEdit={false}
    showOwner={true}
    {searchQuery}
    bind:albumGroupIds={albumGroups}
  >
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_albums_in_event')} class="mt-10 mx-auto" />
    {/snippet}
  </Albums>
</UserPageLayout>
