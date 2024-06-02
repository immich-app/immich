<script lang="ts">
  import { goto } from '$app/navigation';
  import empty2Url from '$lib/assets/empty-2.svg';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiLink, mdiPlusBoxOutline } from '@mdi/js';
  import type { PageData } from './$types';
  import { createAlbumAndRedirect } from '$lib/utils/album-utils';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumSortBy,
    AlbumViewMode,
    SortOrder,
    type AlbumViewSettings,
  } from '$lib/stores/preferences.store';
  import Albums from '$lib/components/album-page/albums-list.svelte';
  import { t } from 'svelte-i18n';

  export let data: PageData;

  const settings: AlbumViewSettings = {
    view: AlbumViewMode.Cover,
    filter: AlbumFilter.Shared,
    groupBy: AlbumGroupBy.None,
    groupOrder: SortOrder.Desc,
    sortBy: AlbumSortBy.MostRecentPhoto,
    sortOrder: SortOrder.Desc,
    collapsedGroups: {},
  };
</script>

<UserPageLayout title={data.meta.title}>
  <div class="flex" slot="buttons">
    <LinkButton on:click={() => createAlbumAndRedirect()}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <Icon path={mdiPlusBoxOutline} size="18" class="shrink-0" />
        <span class="leading-none max-sm:text-xs">{$t('create_album')}</span>
      </div>
    </LinkButton>

    <LinkButton on:click={() => goto(AppRoute.SHARED_LINKS)}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <Icon path={mdiLink} size="18" class="shrink-0" />
        <span class="leading-none max-sm:text-xs">{$t('shared_links')}</span>
      </div>
    </LinkButton>
  </div>

  <div class="flex flex-col">
    {#if data.partners.length > 0}
      <div class="mb-6 mt-2">
        <div>
          <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('partners')}</p>
        </div>

        <div class="flex flex-row flex-wrap gap-4">
          {#each data.partners as partner (partner.id)}
            <a
              href="{AppRoute.PARTNERS}/{partner.id}"
              class="flex gap-4 rounded-lg px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <UserAvatar user={partner} size="lg" />
              <div class="text-left">
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
          <EmptyPlaceholder
            slot="empty"
            text="Create an album to share photos and videos with people in your network"
            src={empty2Url}
          />
        </Albums>
      </div>
    </div>
  </div>
</UserPageLayout>
