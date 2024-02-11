<script lang="ts">
  import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
  import IndividualSharedViewer from '$lib/components/share-page/individual-shared-viewer.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import ThemeButton from '$lib/components/shared-components/theme-button.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { api, SharedLinkType } from '@api';
  import type { PageData } from './$types';
  import { handleError } from '$lib/utils/handle-error';
  import { user } from '$lib/stores/user.store';

  export let data: PageData;
  let { sharedLink, passwordRequired, sharedLinkKey: key, meta } = data;
  let { title, description } = meta;
  let isOwned = $user ? $user.id === sharedLink?.userId : false;
  let password = '';

  const handlePasswordSubmit = async () => {
    try {
      const result = await api.sharedLinkApi.getMySharedLink({ password, key });
      passwordRequired = false;
      sharedLink = result.data;
      isOwned = $user ? $user.id === sharedLink.userId : false;
      title = (sharedLink.album ? sharedLink.album.albumName : 'Public Share') + ' - Immich';
      description = sharedLink.description || `${sharedLink.assets.length} shared photos & videos.`;
    } catch (error) {
      handleError(error, 'Failed to get shared link');
    }
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>
{#if passwordRequired}
  <header>
    <ControlAppBar showBackButton={false}>
      <svelte:fragment slot="leading">
        <a data-sveltekit-preload-data="hover" class="ml-6 flex place-items-center gap-2 hover:cursor-pointer" href="/">
          <ImmichLogo height={30} width={30} />
          <h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
        </a>
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        <ThemeButton />
      </svelte:fragment>
    </ControlAppBar>
  </header>
  <main
    class="relative h-screen overflow-hidden bg-immich-bg px-6 pt-[var(--navbar-height)] dark:bg-immich-dark-bg sm:px-12 md:px-24 lg:px-40"
  >
    <div class="flex flex-col items-center justify-center mt-20">
      <div class="text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">Password Required</div>
      <div class="mt-4 text-lg text-immich-primary dark:text-immich-dark-primary">
        Please enter the password to view this page.
      </div>
      <div class="mt-4">
        <form novalidate autocomplete="off" on:submit|preventDefault={handlePasswordSubmit}>
          <input type="password" class="immich-form-input mr-2" placeholder="Password" bind:value={password} />
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </div>
  </main>
{/if}

{#if !passwordRequired && sharedLink?.type == SharedLinkType.Album}
  <AlbumViewer {sharedLink} />
{/if}
{#if !passwordRequired && sharedLink?.type == SharedLinkType.Individual}
  <div class="immich-scrollbar">
    <IndividualSharedViewer {sharedLink} {isOwned} />
  </div>
{/if}
