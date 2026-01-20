<script lang="ts">
  import empty2Url from '$lib/assets/empty-2.svg';
  import Albums from '$lib/components/album-page/albums-list.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { Route } from '$lib/route';
  import { getAlbumsActions } from '$lib/services/album.service';
  import { getSharedLinksActions } from '$lib/services/shared-link.service';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumSortBy,
    AlbumViewMode,
    SortOrder,
    type AlbumViewSettings,
  } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const settings: AlbumViewSettings = {
    view: AlbumViewMode.Cover,
    filter: AlbumFilter.Shared,
    groupBy: AlbumGroupBy.None,
    groupOrder: SortOrder.Desc,
    sortBy: AlbumSortBy.MostRecentPhoto,
    sortOrder: SortOrder.Desc,
    collapsedGroups: {},
  };

  const { Create: CreateAlbum } = $derived(getAlbumsActions($t));
  const { ViewAll: ViewSharedLinks } = $derived(getSharedLinksActions($t));
</script>

<UserPageLayout title={data.meta.title} actions={[CreateAlbum, ViewSharedLinks]}>
  <div class="flex flex-col">
    {#if data.partners.length > 0}
      <div class="mb-6 mt-2">
        <div>
          <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('partners')}</p>
        </div>

        <div class="flex flex-row flex-wrap gap-4">
          {#each data.partners as partner (partner.id)}
            <a
              href={Route.viewPartner(partner)}
              class="flex gap-4 rounded-lg px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <UserAvatar user={partner} size="lg" />
              <div class="text-start">
                <p class="text-immich-fg dark:text-immich-dark-fg">
                  {partner.name}
                </p>
                <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
                  {partner.email}
                </p>
              </div>
            </a>
          {/each}
        </div>
      </div>

      <hr class="mb-4 dark:border-immich-dark-gray" />
    {/if}

    <div class="mb-6 mt-2">
      <div>
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('albums')}</p>
      </div>

      <div>
        <!-- Shared Album List -->
        <Albums sharedAlbums={data.sharedAlbums} userSettings={settings} showOwner>
          <!-- Empty List -->
          {#snippet empty()}
            <EmptyPlaceholder text={$t('no_shared_albums_message')} src={empty2Url} class="mt-10 mx-auto" />
          {/snippet}
        </Albums>
      </div>
    </div>
  </div>
</UserPageLayout>
