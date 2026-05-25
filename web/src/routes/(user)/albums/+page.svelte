<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import AlbumsControls from './AlbumsControls.svelte';
  import Albums from '$lib/components/album-page/AlbumsList.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { Route } from '$lib/route';
  import { AlbumFilter, albumViewSettings } from '$lib/stores/preferences.store';
  import { createAlbumAndRedirect } from '$lib/utils/album-utils';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import type { SearchOptions } from '$lib/utils/dipatch';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let albumGroups: string[] = $state([]);
  let searchQuery = $state(page.url.searchParams.get('search') ?? '');

  let previousRoute = $derived.by(() => {
    const url = new URL(page.url);

    if (searchQuery.trim()) {
      url.searchParams.set('search', searchQuery);
    } else {
      url.searchParams.delete('search');
    }

    return `${url.pathname}${url.search}`;
  });

  const syncSearchQueryToUrl = async (_options?: SearchOptions) => {
    const currentUrlSearchQuery = page.url.searchParams.get('search') ?? '';

    if (searchQuery === currentUrlSearchQuery) {
      return;
    }

    const url = new URL(page.url);

    if (searchQuery.trim()) {
      url.searchParams.set('search', searchQuery);
    } else {
      url.searchParams.delete('search');
    }

    await goto(url, { replaceState: true, keepFocus: true, noScroll: true });
  };

  afterNavigate(() => {
    const urlSearchQuery = page.url.searchParams.get('search') ?? '';

    if (urlSearchQuery !== searchQuery) {
      searchQuery = urlSearchQuery;
    }
  });
</script>

<UserPageLayout title={data.meta.title} use={[[scrollMemory, { routeStartsWith: Route.albums() }]]}>
  {#snippet buttons()}
    <div class="flex place-items-center gap-2">
      <AlbumsControls
        {albumGroups}
        bind:searchQuery
        onSearch={syncSearchQueryToUrl}
        onReset={syncSearchQueryToUrl}
      />
    </div>
  {/snippet}

  <div class="xl:hidden">
    <div class="h-14 w-fit py-2 dark:text-immich-dark-fg">
      <GroupTab
        label={$t('show_albums')}
        filters={Object.keys(AlbumFilter)}
        selected={$albumViewSettings.filter}
        onSelect={(selected) => ($albumViewSettings.filter = selected)}
      />
    </div>
    <div class="w-60">
      <SearchBar
        placeholder={$t('search_albums')}
        bind:name={searchQuery}
        showLoadingSpinner={false}
        onSearch={syncSearchQueryToUrl}
        onReset={syncSearchQueryToUrl}
      />
    </div>
  </div>

  <Albums
    ownedAlbums={data.albums}
    sharedAlbums={data.sharedAlbums}
    userSettings={$albumViewSettings}
    allowEdit
    {searchQuery}
    {previousRoute}
    bind:albumGroupIds={albumGroups}
  >

    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_albums_message')} onClick={() => createAlbumAndRedirect()} class="mx-auto mt-10" />
    {/snippet}
  </Albums>
</UserPageLayout>
