<script lang="ts">
  import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
  import Link from 'svelte-material-icons/Link.svelte';
  import { goto } from '$app/navigation';
  import { api } from '@api';
  import type { PageData } from './$types';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import empty2Url from '$lib/assets/empty-2.svg';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { flip } from 'svelte/animate';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { AppRoute } from '$lib/constants';

  export let data: PageData;

  const createSharedAlbum = async () => {
    try {
      const { data: newAlbum } = await api.albumApi.createAlbum({
        createAlbumDto: {
          albumName: 'Untitled',
        },
      });

      goto('/albums/' + newAlbum.id);
    } catch (e) {
      notificationController.show({
        message: 'Error creating album, check console for more details',
        type: NotificationType.Error,
      });

      console.log('Error [createAlbum] ', e);
    }
  };
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
  <div class="flex" slot="buttons">
    <LinkButton on:click={createSharedAlbum}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <PlusBoxOutline size="18" class="shrink-0" />
        <span class="leading-none max-sm:text-xs">Create shared album</span>
      </div>
    </LinkButton>

    <LinkButton on:click={() => goto(AppRoute.SHARED_LINKS)}>
      <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
        <Link size="18" class="shrink-0" />
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
              href="/partners/{partner.id}"
              class="flex gap-4 rounded-lg px-5 py-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <UserAvatar user={partner} size="md" autoColor />
              <div class="text-left">
                <p class="text-immich-fg dark:text-immich-dark-fg">
                  {partner.firstName}
                  {partner.lastName}
                </p>
                <p class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">
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
        <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
          {#each data.sharedAlbums as album (album.id)}
            <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
              <AlbumCard {album} user={data.user} isSharingView showContextMenu={false} />
            </a>
          {/each}
        </div>

        <!-- Empty List -->
        {#if data.sharedAlbums.length === 0}
          <div
            class="m-auto mt-10 flex w-2/3 flex-col place-content-center place-items-center rounded-3xl border bg-gray-50 p-5 dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg md:w-[500px]"
          >
            <img src={empty2Url} alt="Empty shared album" width="500" draggable="false" />
            <p class="text-immich-text-gray-500 text-center">
              Create a shared album to share photos and videos with people in your network
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</UserPageLayout>
