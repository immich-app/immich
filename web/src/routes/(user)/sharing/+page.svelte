<script lang="ts">
  import { goto } from '$app/navigation';
  import empty2Url from '$lib/assets/empty-2.svg';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { AppRoute } from '$lib/constants';
  import { api } from '@api';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';
  import { mdiLink, mdiPlusBoxOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let data: PageData;

  const createSharedAlbum = async () => {
    try {
      const { data: newAlbum } = await api.albumApi.createAlbum({
        createAlbumDto: {
          albumName: '',
        },
      });

      goto(`${AppRoute.ALBUMS}/${newAlbum.id}`);
    } catch (error) {
      notificationController.show({
        message: 'Error creating album, check console for more details',
        type: NotificationType.Error,
      });

      console.log('Error [createAlbum]', error);
    }
  };
</script>

<UserPageLayout title={data.meta.title}>
  <div class="flex" slot="buttons">
    <LinkButton on:click={createSharedAlbum}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <Icon path={mdiPlusBoxOutline} size="18" class="shrink-0" />
        <span class="leading-none max-sm:text-xs">Create shared album</span>
      </div>
    </LinkButton>

    <LinkButton on:click={() => goto(AppRoute.SHARED_LINKS)}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <Icon path={mdiLink} size="18" class="shrink-0" />
        <span class="leading-none max-sm:text-xs">Shared links</span>
      </div>
    </LinkButton>
  </div>

  <div class="flex flex-col">
    {#if data.partners.length > 0}
      <div class="mb-6 mt-2">
        <div>
          <p class="mb-4 font-medium dark:text-immich-dark-fg">Partners</p>
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
        <p class="mb-4 font-medium dark:text-immich-dark-fg">Albums</p>
      </div>

      <div>
        <!-- Share Album List -->
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
          {#each data.sharedAlbums as album, index (album.id)}
            <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
              <AlbumCard preload={index < 20} {album} isSharingView showContextMenu={false} />
            </a>
          {/each}
        </div>

        <!-- Empty List -->
        {#if data.sharedAlbums.length === 0}
          <EmptyPlaceholder
            text="Create a shared album to share photos and videos with people in your network"
            alt="Empty album list"
            src={empty2Url}
          />
        {/if}
      </div>
    </div>
  </div>
</UserPageLayout>
