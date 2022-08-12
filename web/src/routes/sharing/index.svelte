<script context="module" lang="ts">
  export const prerender = false;

  import type { Load } from '@sveltejs/kit';
  import { AlbumResponseDto, api, UserResponseDto } from '@api';
  import { browser } from '$app/env';

  export const load: Load = async ({fetch, session}) => {
    if (!browser && !session.user) {
      return {
        status: 302,
        redirect: '/auth/login'
      };
    }

    try {
      const [user, sharedAlbums] = await Promise.all([
        fetch('/data/user/get-my-user-info').then((r) => r.json()),
        fetch('/data/album/get-all-albums?isShared=true').then((r) => r.json())
      ]);

      return {
        status: 200,
        props: {
          user: user,
          sharedAlbums: sharedAlbums
        }
      };
    } catch (e) {
      return {
        status: 302,
        redirect: '/auth/login'
      };
    }
  };
</script>

<script lang="ts">
  import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
  import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
  import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
  import SharedAlbumListTile from '$lib/components/sharing-page/shared-album-list-tile.svelte';
  import { goto } from '$app/navigation';

  export let user: UserResponseDto;
  export let sharedAlbums: AlbumResponseDto[];

  const createSharedAlbum = async () => {
    try {
      const {data: newAlbum} = await api.albumApi.createAlbum({
        albumName: 'Untitled'
      });

      goto('/albums/' + newAlbum.id);
    } catch (e) {
      console.log('Error [createAlbum] ', e);
    }
  };
</script>

<svelte:head>
    <title>Albums - Immich</title>
</svelte:head>

<section>
    <NavigationBar {user} on:uploadClicked={() => {}}/>
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
    <SideBar/>

    <section class="overflow-y-auto relative">
        <section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
            <!-- Main Section -->
            <div class="px-4 flex justify-between place-items-center">
                <div>
                    <p class="font-medium">Sharing</p>
                </div>

                <div>
                    <button
                            on:click={createSharedAlbum}
                            class="flex place-items-center gap-1 text-sm hover:bg-immich-primary/5 p-2 rounded-lg font-medium hover:text-gray-700"
                    >
						<span>
							<PlusBoxOutline size="18"/>
						</span>
                        <p>Create shared album</p>
                    </button>
                </div>
            </div>

            <div class="my-4">
                <hr/>
            </div>

            <!-- Share Album List -->
            <div class="w-full flex flex-col place-items-center">
                {#each sharedAlbums as album}
                    <a sveltekit:prefetch href={`albums/${album.id}`}>
                        <SharedAlbumListTile {album} {user}/>
                    </a
                    >
                {/each}
            </div>

            <!-- Empty List -->
            {#if sharedAlbums.length === 0}
                <div
                        class="border p-5 w-[50%] m-auto mt-10 bg-gray-50 rounded-3xl flex flex-col place-content-center place-items-center"
                >
                    <img src="/empty-2.svg" alt="Empty shared album" width="500"/>
                    <p class="text-center text-immich-text-gray-500">
                        Create a shared album to share photos and videos with people in your network
                    </p>
                </div>
            {/if}
        </section>
    </section>
</section>
