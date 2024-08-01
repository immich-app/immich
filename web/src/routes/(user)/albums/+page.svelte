<script lang="ts">
  import type { PageData } from './$types';
  import { beforeNavigate } from '$app/navigation';
  import { AlbumFilter, albumViewSettings } from '$lib/stores/preferences.store';
  import { createAlbumAndRedirect } from '$lib/utils/album-utils';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AlbumsControls from '$lib/components/album-page/albums-controls.svelte';
  import Albums from '$lib/components/album-page/albums-list.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import GroupTab from '$lib/components/elements/group-tab.svelte';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import { AppRoute, SessionStorageKey } from '$lib/constants';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  export let data: PageData;

  let scrollSlot: HTMLDivElement;
  beforeNavigate(({ to }) => {
    // Save current scroll information when going into a person page.
    if (to && to.url.pathname.startsWith(AppRoute.ALBUMS)) {
      sessionStorage.setItem(SessionStorageKey.SCROLL_POSITION, scrollSlot.scrollTop.toString());
    } else {
      sessionStorage.removeItem(SessionStorageKey.SCROLL_POSITION);
    }
  });
  onMount(() => {
    let newScroll = sessionStorage.getItem(SessionStorageKey.SCROLL_POSITION);
    if (newScroll) {
      scrollSlot.scroll({
        top: Number.parseFloat(newScroll),
        behavior: 'instant',
      });
    }
    sessionStorage.removeItem(SessionStorageKey.SCROLL_POSITION);
  });

  let searchQuery = '';
  let albumGroups: string[] = [];
</script>

<UserPageLayout title={data.meta.title} bind:scrollSlot>
  <div class="flex place-items-center gap-2" slot="buttons">
    <AlbumsControls {albumGroups} bind:searchQuery />
  </div>

  <div class="xl:hidden">
    <div class="w-fit h-14 dark:text-immich-dark-fg py-2">
      <GroupTab
        filters={Object.keys(AlbumFilter)}
        selected={$albumViewSettings.filter}
        onSelect={(selected) => ($albumViewSettings.filter = selected)}
      />
    </div>
    <div class="w-60">
      <SearchBar placeholder={$t('search_albums')} bind:name={searchQuery} showLoadingSpinner={false} />
    </div>
  </div>

  <Albums
    ownedAlbums={data.albums}
    sharedAlbums={data.sharedAlbums}
    userSettings={$albumViewSettings}
    allowEdit
    {searchQuery}
    bind:albumGroupIds={albumGroups}
  >
    <EmptyPlaceholder slot="empty" text={$t('no_albums_message')} onClick={() => createAlbumAndRedirect()} />
  </Albums>
</UserPageLayout>
